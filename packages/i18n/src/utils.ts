import type { LanguageCode, Translations } from './types';
import { supportedLanguages } from './types';

export function detectBrowserLanguageCode(headers: Headers) {
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

  const bestLanguage = languages.find((language) => supportedLanguages.includes(language.code as LanguageCode));
  return (bestLanguage?.code ?? 'en') as LanguageCode;
}

export function toTr(text: string) {
  console.warn('Missing translation:', text);
  return text;
}

export function translate<K extends string>(code: LanguageCode, text: K, translations: Translations<K>) {
  if (code === 'en') return text;
  return translations[text][code];
}
