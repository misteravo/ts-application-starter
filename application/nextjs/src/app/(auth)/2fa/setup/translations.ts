import type { Translations } from '@acme/i18n';

export const translations = {
  'Authenticator apps': { fr: "Applications d'authentification" },
  'Choose a method to add an extra layer of security to your account': {
    fr: 'Choisissez une méthode pour ajouter une couche de sécurité supplémentaire à votre compte',
  },
  Passkeys: { fr: "Clés d'accès" },
  'Security keys': { fr: 'Clés de sécurité' },
  'Set up two-factor authentication': { fr: "Configurer l'authentification à deux facteurs" },
} satisfies Translations<string>;
