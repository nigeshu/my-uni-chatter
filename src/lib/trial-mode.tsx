import { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TrialModeContextType {
  isTrialMode: boolean;
  enterTrialMode: () => void;
  exitTrialMode: () => void;
  /** Call before any write operation. Returns true if allowed, false if blocked (shows toast). */
  guardAction: (actionName?: string) => boolean;
}

const TrialModeContext = createContext<TrialModeContextType>({
  isTrialMode: false,
  enterTrialMode: () => {},
  exitTrialMode: () => {},
  guardAction: () => true,
});

export const useTrialMode = () => useContext(TrialModeContext);

export const TrialModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTrialMode, setIsTrialMode] = useState(false);
  const { toast } = useToast();

  const enterTrialMode = useCallback(() => setIsTrialMode(true), []);
  const exitTrialMode = useCallback(() => setIsTrialMode(false), []);

  const guardAction = useCallback((actionName?: string) => {
    if (!isTrialMode) return true;
    toast({
      title: '🔒 Trial Mode',
      description: actionName 
        ? `"${actionName}" is not available in trial mode. Sign in to access all features!`
        : 'This action is not available in trial mode. Sign in to access all features!',
      variant: 'destructive',
    });
    return false;
  }, [isTrialMode, toast]);

  return (
    <TrialModeContext.Provider value={{ isTrialMode, enterTrialMode, exitTrialMode, guardAction }}>
      {children}
    </TrialModeContext.Provider>
  );
};
