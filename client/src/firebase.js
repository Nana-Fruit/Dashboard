// Firebase client SDK bootstrap. These values are public (safe to ship in
// the bundle) - copy them from Firebase console -> Project settings ->
// General -> Your apps -> SDK setup and configuration.
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps()[0] || initializeApp(firebaseConfig);

export const auth = getAuth(app);
