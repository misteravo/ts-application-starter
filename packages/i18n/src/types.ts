export const supportedLanguages = ['en', 'fr'] as const;

export type LanguageCode = (typeof supportedLanguages)[number];

export type Translations<K extends string> = Record<K, { fr: string }>;
