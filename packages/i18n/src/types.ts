export const supportedLanguages = ['en', 'fr'] as const;

export type LanguageCode = (typeof supportedLanguages)[number];
