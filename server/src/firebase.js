// Firebase Admin SDK bootstrap. Verifies client ID tokens (auth/middleware.js)
// and backs the config store (data/store.js) with Firestore.
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "./config.js";

function loadCredential() {
  if (!config.firebase.serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set - copy the service account JSON as a single-line string into server/.env"
    );
  }
  try {
    return cert(JSON.parse(config.firebase.serviceAccountKey));
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
  }
}

const app = getApps()[0] || initializeApp({ credential: loadCredential() });

export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
