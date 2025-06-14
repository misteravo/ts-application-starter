import type { Translations } from '@acme/i18n';

export const translations = {
  Next: { fr: 'Suivant' },
  'Recovery Code': { fr: 'Code de récupération' },
  'You can use this recovery code if you lose access to your second factors.': {
    fr: "Vous pouvez utiliser ce code de récupération si vous perdez l'accès à vos seconds facteurs.",
  },
  'Your recovery code is:': { fr: 'Votre code de récupération est :' },
} satisfies Translations<string>;
