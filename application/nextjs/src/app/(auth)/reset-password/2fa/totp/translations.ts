import type { Translations } from '@acme/i18n';

export const translations = {
  'Authenticate with authenticator app': { fr: "S'authentifier avec l'application d'authentification" },
  Code: { fr: 'Code' },
  'Enter the code from your app.': { fr: 'Entrez le code de votre application.' },
  'Use passkeys': { fr: "Utiliser les clés d'accès" },
  'Use recovery code': { fr: 'Utiliser le code de récupération' },
  'Use security keys': { fr: 'Utiliser les clés de sécurité' },
  Verify: { fr: 'Vérifier' },
} satisfies Translations<string>;
