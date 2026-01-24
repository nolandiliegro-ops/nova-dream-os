import { useState, useEffect, useCallback } from "react";

export const DEFAULT_WIDGET_ORDER = [
  "revenue",
  "projects", 
  "deadlines",
  "goal",
  "tools",
  "calendar",
  "focus",
  "tasks",
];

const getStorageKey = (mode: "work" | "personal") => 
  `nova-dashboard-layout-${mode}`;

export function useDashboardLayout(mode: "work" | "personal" = "work") {
  const STORAGE_KEY = getStorageKey(mode);
  
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that all default widgets are present
        const allPresent = DEFAULT_WIDGET_ORDER.every((id) => parsed.includes(id));
        if (allPresent && parsed.length === DEFAULT_WIDGET_ORDER.length) {
          return parsed;
        }
      }
    } catch {
      // Invalid JSON, use default
    }
    return DEFAULT_WIDGET_ORDER;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Re-sync widget order when mode changes
  useEffect(() => {
    const key = getStorageKey(mode);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const allPresent = DEFAULT_WIDGET_ORDER.every((id) => parsed.includes(id));
        if (allPresent && parsed.length === DEFAULT_WIDGET_ORDER.length) {
          setWidgetOrder(parsed);
          return;
        }
      }
    } catch {
      // Invalid JSON
    }
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
  }, [mode]);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgetOrder));
  }, [widgetOrder, STORAGE_KEY]);

  const moveWidget = useCallback((widgetId: string, direction: "up" | "down") => {
    setWidgetOrder((prev) => {
      const index = prev.indexOf(widgetId);
      if (index === -1) return prev;

      const newIndex =
        direction === "up"
          ? Math.max(0, index - 1)
          : Math.min(prev.length - 1, index + 1);

      if (newIndex === index) return prev;

      const newOrder = [...prev];
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      return newOrder;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  return {
    widgetOrder,
    isEditMode,
    setIsEditMode,
    toggleEditMode,
    moveWidget,
    resetOrder,
  };
}
