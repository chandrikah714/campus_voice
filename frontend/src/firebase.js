import { initializeApp, deleteApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let messaging;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn("Messaging not supported in this browser:", e);
}

const saveUserToken = async (uid, token) => {
  if (!uid || !token) return;
  try {
    await setDoc(doc(db, "users", uid), { fcmToken: token }, { merge: true });
  } catch (err) {
    console.error("Error saving FCM token:", err);
  }
};

export const requestForToken = async (uid) => {
  if (!messaging) return;
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    if (token) {
      await saveUserToken(uid, token);
    }
  } catch (err) {
    // Notification permission denied or unsupported — not fatal.
    console.warn("Could not get FCM token:", err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => resolve(payload));
  });

export const refreshTokenIfNeeded = async (uid) => {
  await requestForToken(uid);
};

// Creates a new Auth account without disturbing the caller's own signed-in
// session. `createUserWithEmailAndPassword` on the default `auth` instance
// automatically signs in as the newly created user — fine for self-service
// registration, but it meant an admin creating a user from Manage Users was
// immediately signed out of their own account and signed in as that new
// user. This runs the creation on a throwaway secondary app instance so the
// admin's session in `auth` is never touched.
export const createUserAccount = async (email, password) => {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = credential.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
};
