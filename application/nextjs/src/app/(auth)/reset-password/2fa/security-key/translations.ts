import type { Translations } from '@acme/i18n';

export const translations = {
  Authenticate: { fr: "S'authentifier" },
  'Authenticate with security keys': { fr: "S'authentifier avec les clés de sécurité" },
  'Use authenticator apps': { fr: "Utiliser les applications d'authentification" },
  'Use passkeys': { fr: "Utiliser les clés d'accès" },
  'Use recovery code': { fr: 'Utiliser le code de récupération' },
} satisfies Translations<string>;
