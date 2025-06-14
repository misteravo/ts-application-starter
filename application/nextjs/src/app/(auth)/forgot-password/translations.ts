import type { Translations } from '@acme/i18n';

export const translations = {
  'Back to Sign in': { fr: 'Retour à la connexion' },
  Email: { fr: 'Email' },
  'Enter your email address': { fr: 'Entrez votre adresse email' },
  "Enter your email address and we'll send you a link to reset your password.": {
    fr: 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
  },
  'Forgot your password?': { fr: 'Mot de passe oublié ?' },
  'Send Reset Link': { fr: 'Envoyer le lien de réinitialisation' },
} satisfies Translations<string>;
