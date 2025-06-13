import type { LanguageCode } from './types';
import { supportedLanguages } from './types';

type CookiesManager = {
  get: (name: string) => CookieValue | undefined;
  set: (name: string, value: string, attributes: CookieAttributes) => void;
  delete: (name: string) => void;
};

type CookieValue = {
  value: string | null;
};

type CookieAttributes = {
  secure?: boolean;
  path?: string;
  domain?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  httpOnly?: boolean;
  maxAge?: number;
  expires?: Date;
};

export function getLanguageCode(headers: Headers, cookiesManager?: CookiesManager) {
  const rawLanguages = headers.get('Accept-Language')?.split(',') ?? [];
  const languages = rawLanguages
    .map((language) => {
      const [value, quality] = language.split(';');
      return {
        code: value?.split('-')[0] ?? '',
        quality: Number(quality?.replace(/^q=/, '') ?? 1),
      };
    })
    .filter((language) => language.code)
    .sort((language1, language2) => language2.quality - language1.quality);

  const languageCode = cookiesManager?.get('language')?.value ?? undefined;

  const bestLanguage = supportedLanguages.includes(languageCode ?? '')
    ? { code: languageCode as LanguageCode }
    : languages.find((language) => supportedLanguages.includes(language.code));

  return (bestLanguage?.code ?? 'en') as LanguageCode;
}

export function toTr(text: string) {
  console.warn('Missing translation:', text);
  return text;
}
