// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDocument,
  saveDocument,
  subscribeToDoc,
  isFirebaseEnabled,
} from '@/services/firestore-service';

/**
 * Hook d'état persistant — VERSION LOCALE.
 *
 * Par défaut, l'état est conservé dans le localStorage du navigateur :
 * 100% local, hors-ligne, sans aucune base de données. Tous les modules
 * fonctionnent donc même sans Firebase ni émulateur.
 *
 * Si Firebase est activé (émulateur ou cloud, cf. isFirebaseEnabled), une
 * synchronisation best-effort est ajoutée — mais toute erreur réseau est
 * silencieuse et ne casse jamais l'interface (plus de « client is offline »).
 *
 * La synchronisation entre composants/onglets utilisant la même clé est
 * assurée via un évènement local (équivalent du temps réel Firestore).
 */
const FIREBASE = isFirebaseEnabled();
const PREFIX = 'aitt:';
const CHANNEL = 'aitt-store-change';

const isSet = (value: any): value is Set<any> => value instanceof Set;

function readLocal(key: string): { found: boolean; value?: any } {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return { found: false };
    return { found: true, value: JSON.parse(raw) };
  } catch {
    return { found: false };
  }
}

function writeLocal(key: string, value: any) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota dépassé / indisponible : sans danger */
  }
}

function useFirestore<T>(
  collectionName: string,
  docId: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const key = `${collectionName}/${docId}`;
  const initialRef = useRef<T>(initialValue);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const serialize = (value: T) => (isSet(value) ? Array.from(value) : value);
  const deserialize = (value: any): T =>
    isSet(initialRef.current) && Array.isArray(value) ? (new Set(value) as T) : value;

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prevValue) => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        const serialized = serialize(valueToStore);
        writeLocal(key, serialized);
        // Notifier les autres instances du même onglet (sync temps réel locale).
        try {
          window.dispatchEvent(new CustomEvent(CHANNEL, { detail: { key } }));
        } catch {
          /* ignore */
        }
        // Best-effort Firebase (erreurs silencieuses).
        if (FIREBASE) {
          saveDocument(collectionName, docId, { data: serialized }).catch(() => {});
        }
        return valueToStore;
      });
    },
    [key, collectionName, docId]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !collectionName || !docId) return;

    // 1. Charger l'état local (instantané, hors-ligne).
    const local = readLocal(key);
    if (local.found) {
      setStoredValue(deserialize(local.value));
    } else {
      writeLocal(key, serialize(initialRef.current));
    }

    // 2. Best-effort Firebase si activé (n'écrase le local que si une donnée existe).
    let unsubscribe = () => {};
    if (FIREBASE) {
      getDocument<{ data: any }>(collectionName, docId)
        .then((doc) => {
          if (doc) {
            writeLocal(key, doc.data);
            setStoredValue(deserialize(doc.data));
          }
        })
        .catch(() => {});
      try {
        unsubscribe = subscribeToDoc<{ data: any }>(collectionName, docId, (data) => {
          if (data) {
            writeLocal(key, data.data);
            setStoredValue(deserialize(data.data));
          }
        });
      } catch {
        /* ignore */
      }
    }

    // 3. Synchronisation entre composants (même clé) et entre onglets.
    const onLocalChange = (e: any) => {
      if (e?.detail?.key && e.detail.key !== key) return;
      const r = readLocal(key);
      if (r.found) setStoredValue(deserialize(r.value));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFIX + key) onLocalChange({ detail: { key } });
    };
    window.addEventListener(CHANNEL, onLocalChange);
    window.addEventListener('storage', onStorage);

    return () => {
      try { unsubscribe(); } catch { /* ignore */ }
      window.removeEventListener(CHANNEL, onLocalChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [key, collectionName, docId]);

  return [storedValue, setValue];
}

export default useFirestore;
