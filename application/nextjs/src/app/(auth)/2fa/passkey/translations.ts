import type { Translations } from '@acme/i18n';

export const translations = {
  Authenticate: { fr: "S'authentifier" },
  'Authenticate with passkeys': { fr: "S'authentifier avec les clés d'accès" },
  'Use authenticator apps': { fr: "Utiliser les applications d'authentification" },
  'Use recovery code': { fr: 'Utiliser le code de récupération' },
  'Use security keys': { fr: 'Utiliser les clés de sécurité' },
} satisfies Translations<string>;
