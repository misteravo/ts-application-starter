import type { Translations } from '@acme/i18n';

export const translations = {
  'Authenticating...': { fr: 'Authentification...' },
  "Don't have an account?": { fr: "Vous n'avez pas de compte ?" },
  Email: { fr: 'Email' },
  'Enter your email address': { fr: 'Entrez votre adresse email' },
  'Enter your password': { fr: 'Entrez votre mot de passe' },
  'Failed to create public key': { fr: 'Échec de la création de la clé publique' },
  'Failed to sign in with passkey. Please try again.': {
    fr: "Échec de la connexion avec la clé d'accès. Veuillez réessayer.",
  },
  'Forgot password?': { fr: 'Mot de passe oublié ?' },
  Or: { fr: 'Ou' },
  Password: { fr: 'Mot de passe' },
  'Sign in': { fr: 'Se connecter' },
  'Sign in to your account': { fr: 'Se connecter à votre compte' },
  'Sign in with passkey': { fr: "Se connecter avec une clé d'accès" },
  'Sign up': { fr: "S'inscrire" },
  'Signing in...': { fr: 'Connexion...' },
  'Unexpected error': { fr: 'Erreur inattendue' },
} satisfies Translations<string>;
