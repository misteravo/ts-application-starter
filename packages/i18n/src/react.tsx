'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { LanguageCode, Translations } from './types';
import { translate } from './utils';

const LanguageContext = createContext<LanguageCode>('en');

export function useLanguageCode() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ code, children }: { code: LanguageCode; children: ReactNode }) {
  return <LanguageContext.Provider value={code}>{children}</LanguageContext.Provider>;
}

export function useTranslate<K extends string>(translations: Translations<K>) {
  const code = useLanguageCode();

  return function tr(text: K) {
    return translate(code, text, translations);
  };
}
