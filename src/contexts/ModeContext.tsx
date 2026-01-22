import React, { createContext, useContext, useState } from "react";

type Mode = "work" | "personal";

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<Mode>("work");

  const toggleMode = () => {
    setMode((prev) => (prev === "work" ? "personal" : "work"));
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
