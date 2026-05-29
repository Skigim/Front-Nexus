// Firebase initialization for Front-Nexus.
//
// Responsibilities:
//   * Initialize the Firebase app from environment configuration.
//   * Expose a Firestore instance for reading/writing stats data.
//   * Expose Discord OAuth (via Firebase's generic OpenID Connect provider).
//
// Firebase has no first-class Discord provider, so we authenticate through a
// custom OIDC provider configured in the Firebase console (Authentication ->
// Sign-in method -> Add new provider -> OpenID Connect). The provider id from
// the console (prefixed with "oidc.") is supplied via VITE_DISCORD_OIDC_PROVIDER_ID.

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  OAuthProvider,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Provider id of the Discord OIDC integration configured in the Firebase console.
const DISCORD_PROVIDER_ID =
  import.meta.env.VITE_DISCORD_OIDC_PROVIDER_ID || 'oidc.discord';

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

/**
 * Build the Discord OAuth provider. Scopes mirror Discord's OAuth2 surface so
 * we can read the user's identity after sign-in.
 */
export function getDiscordProvider(): OAuthProvider {
  const provider = new OAuthProvider(DISCORD_PROVIDER_ID);
  provider.addScope('identify');
  provider.addScope('email');
  return provider;
}

/** Launch the Discord OAuth popup flow. */
export function loginWithDiscord(): Promise<UserCredential> {
  return signInWithPopup(auth, getDiscordProvider());
}

/** Sign the current user out. */
export function logout(): Promise<void> {
  return firebaseSignOut(auth);
}
