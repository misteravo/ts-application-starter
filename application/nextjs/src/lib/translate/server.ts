import { getLanguageCode } from '@acme/i18n';
import { cookies, headers } from 'next/headers';
import { translate } from './client';
import type { TranslationKey } from './client';

export async function getTranslate() {
  const code = getLanguageCode(await headers(), await cookies());
  return function tr(text: TranslationKey) {
    return translate(text, code);
  };
}

export async function asyncTr(text: TranslationKey) {
  const code = getLanguageCode(await headers(), await cookies());
  return translate(text, code);
}
