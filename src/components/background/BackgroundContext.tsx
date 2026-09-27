'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Element } from '@/lib/enka/types';

interface BackgroundContextType {
  element: Element | undefined;
  setElement: (element: Element | undefined) => void;
}

const BackgroundContext = createContext<BackgroundContextType>({
  element: undefined,
  setElement: () => {},
});

export function useBackground() {
  return useContext(BackgroundContext);
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [element, setElement] = useState<Element | undefined>(undefined);

  return (
    <BackgroundContext.Provider value={{ element, setElement }}>
      {children}
    </BackgroundContext.Provider>
  );
}
