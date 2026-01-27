import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Zap, Brain, MessageSquare, User, FileText, Trash2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMode } from "@/contexts/ModeContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentAnalysisCard } from "@/components/assistant/DocumentAnalysisCard";
import { useAnalyzeDocument, useLatestDocument, type AnalysisResult } from "@/hooks/useDocumentAnalysis";
import { useChatHistory, type ChatMessage } from "@/hooks/useChatHistory";
import { UploadDropzone } from "@/components/assistant/UploadDropzone";
import { AttachmentPicker } from "@/components/assistant/AttachmentPicker";
import { AttachmentPreview, type Attachment } from "@/components/assistant/AttachmentPreview";
import { LoadingMessage, type LoadingAction } from "@/components/assistant/LoadingMessage";
import { ActionCardRenderer, removeActionsFromContent } from "@/components/assistant/ActionCardRenderer";
import { replaceDatesInText } from "@/utils/dateParser";
import { useUploadDocument } from "@/hooks/useDocuments";
import { AnimatePresence } from "framer-motion";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Assistant() {
  const { user } = useAuth();
  const { mode } = useMode();
  
  // Database-backed chat history
  const { 
    messages: dbMessages, 
    addMessage, 
    clearHistory, 
    isLoading: historyLoading,
    isClearingHistory 
  } = useChatHistory();
  
  // Local state for streaming messages
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>("thinking");
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [input, setInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: latestDocument } = useLatestDocument(mode);
  const analyzeDocument = useAnalyzeDocument();
  const uploadDocument = useUploadDocument();

  // Combine DB messages with streaming message
  const displayMessages: ChatMessage[] = [
    ...dbMessages,
    ...(isStreaming && streamingContent 
      ? [{ 
          id: 'streaming', 
          user_id: user?.id || '', 
          role: 'assistant' as const, 
          content: streamingContent,
          attachments: [],
          created_at: new Date().toISOString()
        }] 
      : []
    ),
  ];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, streamingContent]);

  const handleFileDrop = useCallback(async (files: File[]) => {
    for (const file of files) {
      const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = file.type.startsWith("image/") 
        ? URL.createObjectURL(file) 
        : undefined;
      
      setAttachments((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          type: "file",
          mimeType: file.type,
          previewUrl,
          file,
        },
      ]);
    }
  }, []);

  const handleDocumentSelect = useCallback((doc: { id: string; name: string; file_path: string }) => {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setAttachments((prev) => [
      ...prev,
      {
        id,
        name: doc.name,
        type: "document",
        documentId: doc.id,
        filePath: doc.file_path,
      },
    ]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const streamChat = useCallback(async (userMessages: { role: string; content: string }[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: userMessages,
        userId: user?.id,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        throw new Error(errorData.error || "Rate limit atteint. Réessaie dans un moment.");
      }
      if (resp.status === 402) {
        throw new Error(errorData.error || "Crédits IA épuisés.");
      }
      throw new Error(errorData.error || "Erreur de connexion à Nova");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setStreamingContent(assistantContent);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setStreamingContent(assistantContent);
          }
        } catch {
          /* ignore */
        }
      }
    }

    return assistantContent;
  }, [user?.id]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isStreaming) return;

    // Parse dates in French and replace them with ISO format
    const processedMessage = replaceDatesInText(messageText);

    // Upload any file attachments first
    const uploadedAttachments: { name: string; id?: string }[] = [];
    if (attachments.length > 0) {
      setLoadingAction("upload");
      for (const attachment of attachments) {
        if (attachment.type === "file" && attachment.file) {
          try {
            const doc = await uploadDocument.mutateAsync({
              file: attachment.file,
              segment: "other",
              mode: mode as "work" | "personal",
            });
            uploadedAttachments.push({ name: attachment.name, id: doc.id });
          } catch (error) {
            console.error("Error uploading file:", error);
          }
        } else if (attachment.type === "document") {
          uploadedAttachments.push({ name: attachment.name, id: attachment.documentId });
        }
      }
    }

    // Add user message to DB
    const userContent = attachments.length > 0
      ? `${processedMessage}\n\n[Fichiers joints: ${attachments.map(a => a.name).join(", ")}]`
      : processedMessage;

    await addMessage({ 
      role: 'user', 
      content: userContent.trim(),
      attachments: uploadedAttachments,
    });

    setInput("");
    setAttachments([]);
    setIsStreaming(true);
    setStreamingContent("");
    setLoadingAction("thinking");

    try {
      // Build messages for API
      const apiMessages = [
        ...dbMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent.trim() },
      ];

      const assistantContent = await streamChat(apiMessages);
      
      // Save assistant response to DB
      if (assistantContent) {
        await addMessage({ 
          role: 'assistant', 
          content: assistantContent,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de connexion à Nova");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!latestDocument) return;
    
    try {
      setLoadingAction("analyze");
      const result = await analyzeDocument.mutateAsync(latestDocument.id);
      setAnalysisResult(result);
      toast.success("Document analysé avec succès !");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const quickActions = [
    "Où en suis-je de mon objectif 1M€ ?",
    "Quelles sont mes priorités aujourd'hui ?",
    "Résumé de mes projets actifs",
    "Analyse mon dernier document",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Assistant <span className="text-gradient">Nova</span>
            </h1>
            <p className="text-muted-foreground">
              Ton copilote IA connecté à tes données pour atteindre 1M€
            </p>
          </div>
          {dbMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              disabled={isClearingHistory}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle conversation</span>
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 h-[calc(100%-5rem)]">
          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col">
            <UploadDropzone onFileDrop={handleFileDrop} disabled={isStreaming}>
              <GlassCard className="flex-1 flex flex-col p-6 overflow-hidden h-full">
                {/* Messages Area */}
                <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                  {historyLoading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                      <LoadingMessage action="query" />
                    </div>
                  ) : displayMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 mb-4">
                        <Bot className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Bienvenue, Nono 👋</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        Je suis Nova, ton assistant IA personnel. J'ai accès à tes finances, 
                        projets et tâches en temps réel pour t'aider à atteindre ton objectif 1M€.
                      </p>
                      
                      {/* Quick actions */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickActions.map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => sendMessage(suggestion)}
                            disabled={isStreaming}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {displayMessages.map((msg) => (
                        <div key={msg.id}>
                          <div
                            className={cn(
                              "flex gap-3",
                              msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {msg.role === "assistant" && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-3",
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/50 text-foreground"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.role === "assistant" 
                                  ? removeActionsFromContent(msg.content)
                                  : msg.content
                                }
                              </p>
                            </div>
                            {msg.role === "user" && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                                <User className="h-4 w-4 text-secondary-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Action Cards for assistant messages */}
                          {msg.role === "assistant" && msg.id !== 'streaming' && (
                            <div className="ml-11">
                              <ActionCardRenderer content={msg.content} />
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Loading indicator */}
                      <AnimatePresence>
                        {isStreaming && !streamingContent && (
                          <LoadingMessage action={loadingAction} />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </ScrollArea>
                
                {/* Attachment Preview */}
                {attachments.length > 0 && (
                  <div className="border-t border-border/50 pt-3 mt-3">
                    <AttachmentPreview 
                      attachments={attachments} 
                      onRemove={removeAttachment}
                    />
                  </div>
                )}
                
                {/* Input Area */}
                <form onSubmit={handleSubmit} className="border-t border-border/50 pt-4 mt-4">
                  <div className="flex gap-2">
                    <AttachmentPicker
                      onFileSelect={handleFileDrop}
                      onDocumentSelect={handleDocumentSelect}
                      disabled={isStreaming}
                    />
                    <Input 
                      placeholder="Pose ta question à Nova..."
                      className="flex-1"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isStreaming}
                    />
                    <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Propulsé par Gemini · Données en temps réel · Drag & Drop supporté
                  </p>
                </form>
              </GlassCard>
            </UploadDropzone>
          </div>

          {/* Capabilities Sidebar */}
          <div className="space-y-4">
            {/* Document Analysis Card */}
            <DocumentAnalysisCard
              analysis={analysisResult}
              isLoading={analyzeDocument.isPending}
              onAnalyze={handleAnalyzeDocument}
              latestDocumentName={latestDocument?.name}
            />

            <GlassCard className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Capacités Nova</h3>
                  <p className="text-xs text-muted-foreground">Connecté à tes données</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { icon: Brain, label: "Analyse financière", desc: "Progression objectif 1M€" },
                  { icon: Zap, label: "Priorisation", desc: "Tâches urgentes du jour" },
                  { icon: FileText, label: "Lecture documents", desc: "OCR & extraction IA" },
                  { icon: MessageSquare, label: "Conseils business", desc: "Stratégies croissance" },
                ].map((cap) => (
                  <div key={cap.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <cap.icon className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{cap.label}</p>
                      <p className="text-xs text-muted-foreground">{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="font-semibold mb-3">Essaie ces questions</h3>
              <ul className="space-y-2">
                {quickActions.map((action, index) => (
                  <li key={index}>
                    <button
                      onClick={() => sendMessage(action)}
                      disabled={isStreaming}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full flex items-center gap-2"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {action}
                    </button>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
