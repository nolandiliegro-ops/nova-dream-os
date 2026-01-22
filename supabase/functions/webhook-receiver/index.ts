import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping des sources vers les segments
const sourceToSegment: Record<string, string> = {
  'tiktok_shop': 'tiktok',
  'tiktok': 'tiktok',
  'shopify': 'ecommerce',
  'ecommerce': 'ecommerce',
  'stripe': 'consulting',
  'consulting': 'consulting',
  'oracle': 'oracle',
  'other': 'other',
};

interface WebhookPayload {
  amount: number;
  source?: string;
  segment?: string;
  description?: string;
  date?: string;
  category?: string;
  type?: 'income' | 'expense';
  mode?: 'work' | 'personal';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get token from query params
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token parameter' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for inserting data
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token against api_configs
    const { data: configData, error: configError } = await supabase
      .from('api_configs')
      .select('user_id, config')
      .eq('type', 'n8n_webhook')
      .eq('is_active', true);

    if (configError) {
      console.error('Error fetching config:', configError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find matching user by token
    let matchedUserId: string | null = null;
    for (const config of configData || []) {
      const configJson = config.config as { webhook_token?: string };
      if (configJson?.webhook_token === token) {
        matchedUserId = config.user_id;
        break;
      }
    }

    if (!matchedUserId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const payload: WebhookPayload = await req.json();

    // Validate required fields
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing amount. Must be a positive number.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map source to segment
    const sourceKey = (payload.source || payload.segment || 'other').toLowerCase();
    const segment = sourceToSegment[sourceKey] || 'other';

    // Prepare transaction data
    const transactionData = {
      user_id: matchedUserId,
      amount: payload.amount,
      type: payload.type || 'income',
      segment: segment,
      category: payload.category || null,
      description: payload.description || `Vente ${segment} via n8n`,
      date: payload.date || new Date().toISOString().split('T')[0],
      mode: payload.mode || 'work',
      counts_toward_goal: true,
    };

    // Insert transaction
    const { data: insertedData, error: insertError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert transaction', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction created:', insertedData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transaction created successfully',
        transaction: insertedData 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
