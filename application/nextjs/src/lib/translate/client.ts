import type { LanguageCode } from '@acme/i18n';
import { useLanguageCode } from '@acme/i18n/react';
import { translations } from '~/locales/translations';

export type Translator = (text: TranslationKey) => string;
export type TranslationKey = keyof typeof translations;

export function useTranslate() {
  const code = useLanguageCode();

  return function tr(text: TranslationKey) {
    return translate(text, code);
  };
}

export function translate(text: TranslationKey, code: LanguageCode) {
  if (code === 'en') return text;
  return translations[text][code];
}
