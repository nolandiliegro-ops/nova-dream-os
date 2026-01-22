import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Segment display names and colors
const segmentLabels: Record<string, string> = {
  ecommerce: "E-commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  other: "Autre",
};

export function useRealtimeTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload cha-ching sound
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2058/2058-preview.mp3");
    audioRef.current.volume = 0.5;

    return () => {
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newTransaction = payload.new as {
            amount: number;
            segment: string;
            type: string;
            description: string | null;
          };

          // Only celebrate income transactions
          if (newTransaction.type === 'income') {
            // Play cha-ching sound
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {
                // Ignore autoplay errors
              });
            }

            // Fire confetti
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.3 },
              colors: ['#10B981', '#22C55E', '#4ADE80', '#86EFAC', '#FFD700'],
            });

            // Show celebratory toast
            const segmentLabel = segmentLabels[newTransaction.segment] || newTransaction.segment;
            toast.success(
              `💰 Cha-ching! +${newTransaction.amount.toLocaleString('fr-FR')}€`,
              {
                description: `${segmentLabel} - ${newTransaction.description || 'Nouvelle vente'}`,
                duration: 5000,
                style: {
                  background: 'linear-gradient(135deg, hsl(var(--segment-ecommerce)) 0%, hsl(var(--primary)) 100%)',
                  color: 'white',
                  border: 'none',
                },
              }
            );
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
