import React, { createContext, useContext, useState, useEffect } from 'react';

export type AIProvider = 'gemini' | 'deepseek' | 'groq' | 'mistral' | 'anthropic' | 'fireworks';

interface AiContextType {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<AIProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_provider');
      return (saved as AIProvider) || 'gemini';
    } catch (e) {
      return 'gemini';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduai_provider', provider);
    } catch (e) {
      console.error('Failed to save provider to localStorage', e);
    }
  }, [provider]);

  return (
    <AiContext.Provider value={{ provider, setProvider }}>
      {children}
    </AiContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) throw new Error('useAi must be used within an AiProvider');
  return context;
};
