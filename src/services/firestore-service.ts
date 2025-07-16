// @ts-nocheck
/**
 * @fileoverview Service for interacting with Firebase Firestore.
 * This service is designed to be isomorphic, running on both server and client.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZkXzqMwnNlp6rues-pIebFxWroA72H3Y",
  authDomain: "cognitive-collective.firebaseapp.com",
  projectId: "cognitive-collective",
  storageBucket: "cognitive-collective.firebasestorage.app",
  messagingSenderId: "137160897256",
  appId: "1:137160897256:web:9f5a4cf22bebf3ecbd0f5d"
};


let app: FirebaseApp;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  db = getFirestore(app);
}

/**
 * Ensures Firestore is initialized, especially for server-side contexts.
 */
function ensureFirestoreInitialized() {
  if (!db) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
}

/**
 * Retrieves a document from a specified Firestore collection.
 * @param collectionName The name of the collection.
 * @param docId The ID of the document.
 * @returns The document data or null if it doesn't exist.
 */
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  ensureFirestoreInitialized();
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as T;
  }
  return null;
}

/**
 * Saves a document to a specified Firestore collection.
 * @param collectionName The name of the collection.
 * @param docId The ID of the document.
 * @param data The data to save.
 */
export async function saveDocument<T>(collectionName: string, docId: string, data: T): Promise<void> {
  ensureFirestoreInitialized();
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, data, { merge: true });
}

/**
 * Subscribes to real-time updates for a document.
 * @param collectionName The name of the collection.
 * @param docId The ID of the document.
 * @param callback The function to call with the new data.
 * @returns An unsubscribe function.
 */
export function subscribeToDoc<T>(collectionName: string, docId: string, callback: (data: T | null) => void): () => void {
  ensureFirestoreInitialized();
  const docRef = doc(db, collectionName, docId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as T);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
}
