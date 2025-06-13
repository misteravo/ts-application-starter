export const supportedLanguages = ['en', 'fr'] as const;

export type LanguageCode = (typeof supportedLanguages)[number];

type NonEnglishLanguageCode = Exclude<LanguageCode, 'en'>;

export type Translations<K extends string> = Record<K, Record<NonEnglishLanguageCode, string>>;
