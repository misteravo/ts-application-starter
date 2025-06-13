import type { Translations } from '@acme/i18n';
import { getLanguageCode, translate } from '@acme/i18n';
import { cookies, headers } from 'next/headers';

export async function getTranslate<K extends string>(translations: Translations<K>) {
  const code = getLanguageCode(await headers(), await cookies());

  return function tr(text: K) {
    return translate(code, text, translations);
  };
}
