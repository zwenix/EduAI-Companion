import React, { createContext, useContext, useState, useEffect } from 'react';

export type AIProvider = 'gemini' | 'deepseek' | 'groq' | 'mistral' | 'anthropic' | 'fireworks';

interface AiContextType {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('eduai_provider') as AIProvider) || 'gemini';
  });

  useEffect(() => {
    localStorage.setItem('eduai_provider', provider);
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
