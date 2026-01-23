import { useEffect, useCallback } from "react";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean; // Cmd on Mac
  callback: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcut(config: ShortcutConfig) {
  const { key, ctrlKey, shiftKey, metaKey, callback, enabled = true } = config;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const matchesKey = event.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey;
      const matchesShift = shiftKey ? event.shiftKey : !event.shiftKey;
      const matchesMeta = metaKey ? event.metaKey || event.ctrlKey : true;

      // For Cmd+Shift+F: need meta/ctrl + shift + F
      if (metaKey && shiftKey) {
        if (
          matchesKey &&
          (event.metaKey || event.ctrlKey) &&
          event.shiftKey
        ) {
          event.preventDefault();
          callback();
        }
        return;
      }

      // For Escape: just the key, no modifiers
      if (key.toLowerCase() === "escape" && matchesKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
        event.preventDefault();
        callback();
        return;
      }

      // Generic case
      if (matchesKey && matchesCtrl && matchesShift && matchesMeta) {
        event.preventDefault();
        callback();
      }
    },
    [key, ctrlKey, shiftKey, metaKey, callback, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Hook for multiple shortcuts
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handlers = shortcuts
      .filter((s) => s.enabled !== false)
      .map((config) => {
        const handler = (event: KeyboardEvent) => {
          const matchesKey = event.key.toLowerCase() === config.key.toLowerCase();

          // Cmd/Ctrl + Shift + Key
          if (config.metaKey && config.shiftKey) {
            if (matchesKey && (event.metaKey || event.ctrlKey) && event.shiftKey) {
              event.preventDefault();
              config.callback();
            }
            return;
          }

          // Escape key
          if (config.key.toLowerCase() === "escape" && matchesKey) {
            event.preventDefault();
            config.callback();
          }
        };

        window.addEventListener("keydown", handler);
        return handler;
      });

    return () => {
      handlers.forEach((handler) => {
        window.removeEventListener("keydown", handler);
      });
    };
  }, [shortcuts]);
}
