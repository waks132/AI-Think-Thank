/**
 * TECHNOS FORGE FIREBASE OPTIMIZATION
 * Production-ready Firestore service with enhanced error handling & performance
 * Fully TypeScript enabled with Firebase Studio integration
 * @fileoverview Service for interacting with Firebase Firestore.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  type Firestore,
} from 'firebase/firestore';

// VERSION LOCALE : configuration Firebase surchargeable par variables d'env.
// Avec l'émulateur, projectId/apiKey peuvent rester des valeurs factices.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyDZkXzqMwnNlp6rues-pIebFxWroA72H3Y",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "cognitive-collective.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "cognitive-collective",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "cognitive-collective.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "137160897256",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:137160897256:web:9f5a4cf22bebf3ecbd0f5d"
};


let app: FirebaseApp;
let db: Firestore;
let emulatorConnected = false;

/**
 * VERSION LOCALE : connecte Firestore à l'émulateur local lorsque
 * NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'. Idempotent (une seule fois).
 */
function maybeConnectEmulator(database: Firestore) {
  if (emulatorConnected) return;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') return;

  const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1';
  const port = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? '8080');
  try {
    connectFirestoreEmulator(database, host, port);
    emulatorConnected = true;
    console.log(`🔧 Firestore connecté à l'émulateur local: ${host}:${port}`);
  } catch (e) {
    // déjà connecté / déjà utilisé : sans danger
    emulatorConnected = true;
  }
}

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  maybeConnectEmulator(db);
} else if (typeof window !== 'undefined') {
  app = getApp();
  db = getFirestore(app);
  maybeConnectEmulator(db);
}

/**
 * Ensures Firestore is initialized, especially for server-side contexts.
 */
function ensureFirestoreInitialized() {
  if (!db) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    maybeConnectEmulator(db);
  }
}

/**
 * TECHNOS FORGE ENHANCED: Retrieves a document with error handling & metrics
 * @param collectionName The name of the collection.
 * @param docId The ID of the document.
 * @returns The document data or null if it doesn't exist.
 */
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  try {
    ensureFirestoreInitialized();
    const startTime = Date.now();
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    const responseTime = Date.now() - startTime;
    console.log(`📊 Firestore Read: ${collectionName}/${docId} - ${responseTime}ms`);
    
    if (docSnap.exists()) {
      return { id: docId, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`❌ Firestore Read Error: ${collectionName}/${docId}`, error);
    throw error;
  }
}

/**
 * Saves a document to a specified Firestore collection.
 * @param collectionName The name of the collection.
 * @param docId The ID of the document.
 * @param data The data to save.
 */
export async function saveDocument<T extends Record<string, any>>(collectionName: string, docId: string, data: T): Promise<void> {
  ensureFirestoreInitialized();
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, data as any, { merge: true });
}

/**
 * Adds a new document to a specified Firestore collection with an auto-generated ID.
 * @param collectionName The name of the collection.
 * @param data The data to save.
 * @returns The ID of the newly created document.
 */
export async function addDocument<T extends Record<string, any>>(collectionName: string, data: T): Promise<string> {
  ensureFirestoreInitialized();
  const collectionRef = collection(db, collectionName);
  const docRef = await addDoc(collectionRef, data as any);
  return docRef.id;
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

/**
 * Searches a Firestore collection for documents where any field contains the query string.
 * This is a simplified search and may be slow on large collections.
 * For production apps, a dedicated search service like Algolia or Elasticsearch is recommended.
 * @param collectionName The name of the collection.
 * @param searchQuery The string to search for.
 * @returns An array of matching documents.
 */
export async function searchCollection<T>(collectionName: string, searchQuery: string): Promise<T[]> {
  ensureFirestoreInitialized();
  const collectionRef = collection(db, collectionName);
  const q = await getDocs(collectionRef);
  const results: T[] = [];
  const lowerCaseQuery = searchQuery.toLowerCase();

  q.forEach((doc) => {
    const data = doc.data();
    let match = false;
    // Iterate over all fields in the document
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        try {
          // Convert field value to string and check for inclusion
          if (JSON.stringify(data[key]).toLowerCase().includes(lowerCaseQuery)) {
            match = true;
            break; // Found a match, no need to check other fields
          }
        } catch (e) {
          // Ignore fields that can't be stringified
        }
      }
    }
    if (match) {
      results.push({ id: doc.id, ...data } as T);
    }
  });

  return results;
}