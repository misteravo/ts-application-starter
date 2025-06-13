'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { LanguageCode } from './types';

const LanguageContext = createContext<LanguageCode>('en');

export function useLanguageCode() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ code, children }: { code: LanguageCode; children: ReactNode }) {
  return <LanguageContext.Provider value={code}>{children}</LanguageContext.Provider>;
}
