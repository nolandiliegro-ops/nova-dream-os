import { useState, useEffect, useCallback } from "react";

export const DEFAULT_PROJECT_WIDGET_ORDER = [
  "timeline",
  "info",
  "roadmap",
  "tasks",
  "finances",
  "documents",
];

const getStorageKey = (projectId: string) => `project-workspace-layout-${projectId}`;

export function useProjectWorkspaceLayout(projectId: string) {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (!projectId) return DEFAULT_PROJECT_WIDGET_ORDER;
    
    const stored = localStorage.getItem(getStorageKey(projectId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate that all default widgets are present
        const isValid = DEFAULT_PROJECT_WIDGET_ORDER.every(w => parsed.includes(w));
        if (isValid && parsed.length === DEFAULT_PROJECT_WIDGET_ORDER.length) {
          return parsed;
        }
      } catch {
        // Invalid JSON, use default
      }
    }
    return DEFAULT_PROJECT_WIDGET_ORDER;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Persist to localStorage when order changes
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(getStorageKey(projectId), JSON.stringify(widgetOrder));
    }
  }, [widgetOrder, projectId]);

  const moveWidget = useCallback((widgetId: string, direction: "up" | "down") => {
    setWidgetOrder(prev => {
      const currentIndex = prev.indexOf(widgetId);
      if (currentIndex === -1) return prev;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newOrder = [...prev];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      return newOrder;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setWidgetOrder(DEFAULT_PROJECT_WIDGET_ORDER);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
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
