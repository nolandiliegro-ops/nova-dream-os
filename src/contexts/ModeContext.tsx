import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";

type Mode = "work" | "personal";

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = "nova-mode";

export const ModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  // Initialize from localStorage first, then sync with profile
  const [mode, setModeState] = useState<Mode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Mode) || "work";
  });

  // Sync with profile when it loads
  useEffect(() => {
    if (profile?.preferred_mode && user) {
      const profileMode = profile.preferred_mode as Mode;
      if (profileMode !== mode) {
        setModeState(profileMode);
        localStorage.setItem(STORAGE_KEY, profileMode);
      }
    }
  }, [profile?.preferred_mode, user]);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    
    // Sync to profile if user is logged in
    if (user) {
      updateProfile.mutate({ preferred_mode: newMode });
    }
  };

  const toggleMode = () => {
    const newMode = mode === "work" ? "personal" : "work";
    setMode(newMode);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
};
