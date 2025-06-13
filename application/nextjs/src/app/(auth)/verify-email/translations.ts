import type { Translations } from '@acme/i18n';

export const translations = {
  Code: { fr: 'Code' },
  'Enter 8-digit code': { fr: 'Entrez le code à 8 chiffres' },
  'Enter the 8-digit code': { fr: 'Entrez le code à 8 chiffres' },
  'Resend code': { fr: 'Renvoyer le code' },
  'Resend verification code': { fr: 'Renvoyer le code de vérification' },
  'Resending...': { fr: 'Envoi en cours...' },
  'Too many requests': { fr: 'Trop de requêtes' },
  'Verification Code': { fr: 'Code de vérification' },
  Verify: { fr: 'Vérifier' },
  'Verify Email': { fr: "Vérifier l'email" },
  'Verify your email address': { fr: 'Vérifiez votre adresse email' },
  'Verifying...': { fr: 'Vérification...' },
  'We sent an 8-digit code to': { fr: 'Nous avons envoyé un code à 8 chiffres à' },
} satisfies Translations<string>;
