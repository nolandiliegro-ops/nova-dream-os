import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentAnalysis {
  summary: string;
  extractedData: {
    amounts: { value: number; currency: string; description: string }[];
    dates: { date: string; context: string }[];
    entities: string[];
  };
  documentType: string;
  suggestedAction?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, userId } = await req.json();

    if (!documentId || !userId) {
      return new Response(
        JSON.stringify({ error: "documentId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL to access the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_path, 300); // 5 minutes

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error("Failed to generate signed URL for document");
    }

    // Determine content type and prepare for Gemini
    const isImage = document.mime_type.startsWith("image/");
    const isPDF = document.mime_type === "application/pdf";
    
    let analysisPrompt = `Tu es un assistant d'analyse documentaire expert. Analyse ce document et extrais les informations clés.

Le document s'appelle "${document.name}" et appartient au segment "${document.segment || 'Non classé'}".

INSTRUCTIONS :
1. Résume le contenu en 2-3 phrases maximum
2. Extrais tous les montants financiers (en précisant la devise et le contexte)
3. Extrais toutes les dates importantes et leur contexte
4. Identifie les entités (entreprises, personnes, produits mentionnés)
5. Détermine le type de document (facture, contrat, devis, note, etc.)
6. Suggère une action pertinente (ex: "Ajouter 500€ en dépense E-commerce")

Réponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "summary": "Résumé court du document",
  "extractedData": {
    "amounts": [{"value": 500.00, "currency": "EUR", "description": "Montant facture"}],
    "dates": [{"date": "2026-01-15", "context": "Date d'émission"}],
    "entities": ["Nom entreprise", "Nom produit"]
  },
  "documentType": "facture",
  "suggestedAction": "Ajouter 500€ en dépense E-commerce"
}`;

    // Build the message content for Gemini
    const messageContent: any[] = [{ type: "text", text: analysisPrompt }];

    // For images, include the image URL directly
    if (isImage) {
      messageContent.push({
        type: "image_url",
        image_url: { url: signedUrlData.signedUrl }
      });
    } else if (isPDF) {
      // For PDFs, Gemini can process them via URL
      messageContent.push({
        type: "file",
        file: { url: signedUrlData.signedUrl }
      });
    }

    // Call Gemini for analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit atteint. Réessaie dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No analysis content received");
    }

    // Parse the JSON response from Gemini
    let analysis: DocumentAnalysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a basic analysis if parsing fails
      analysis = {
        summary: content.slice(0, 300),
        extractedData: { amounts: [], dates: [], entities: [] },
        documentType: "inconnu",
        suggestedAction: undefined,
      };
    }

    // Store the analysis summary in the document record
    await supabase
      .from("documents")
      .update({ 
        description: analysis.summary 
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        documentName: document.name,
        documentSegment: document.segment
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analyze document error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
