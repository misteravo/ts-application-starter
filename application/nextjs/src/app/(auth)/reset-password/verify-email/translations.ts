import type { Translations } from '@acme/i18n';

export const translations = {
  Code: { fr: 'Code' },
  Verify: { fr: 'Vérifier' },
  'Verify your email address': { fr: 'Vérifiez votre adresse email' },
  'We sent an 8-digit code to': { fr: 'Nous avons envoyé un code à 8 chiffres à' },
} satisfies Translations<string>;
