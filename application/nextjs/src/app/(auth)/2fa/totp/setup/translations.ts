import type { Translations } from '@acme/i18n';

export const translations = {
  'Enter the 6-digit code': { fr: 'Entrez le code à 6 chiffres' },
  Save: { fr: 'Enregistrer' },
  'Scan the QR code below with your authenticator app to get started': {
    fr: "Scannez le code QR ci-dessous avec votre application d'authentification pour commencer",
  },
  'Set up authenticator app': { fr: "Configurer l'application d'authentification" },
  'Verify the code from the app': { fr: "Vérifiez le code de l'application" },
} satisfies Translations<string>;
