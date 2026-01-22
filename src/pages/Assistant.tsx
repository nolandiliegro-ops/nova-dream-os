import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Zap, Brain, MessageSquare, Loader2, User } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (userMessages: Message[]) => {
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
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
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
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          /* ignore */
        }
      }
    }
  }, [user?.id]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: messageText.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur de connexion à Nova");
      // Remove the failed assistant message if any
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const quickActions = [
    "Où en suis-je de mon objectif 1M€ ?",
    "Quelles sont mes priorités aujourd'hui ?",
    "Résumé de mes projets actifs",
    "Conseils pour booster mes revenus",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)]">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Assistant <span className="text-gradient">Nova</span>
          </h1>
          <p className="text-muted-foreground">
            Ton copilote IA connecté à tes données pour atteindre 1M€
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 h-[calc(100%-5rem)]">
          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col">
            <GlassCard className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Messages Area */}
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                {messages.length === 0 ? (
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
                          disabled={isLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
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
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                            <User className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted/50 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Nova réfléchit...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t border-border/50 pt-4 mt-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Pose ta question à Nova..."
                    className="flex-1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Propulsé par Gemini · Données en temps réel
                </p>
              </form>
            </GlassCard>
          </div>

          {/* Capabilities Sidebar */}
          <div className="space-y-4">
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
                      disabled={isLoading}
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
