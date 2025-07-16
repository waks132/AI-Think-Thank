// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDocument, saveDocument, subscribeToDoc } from '@/services/firestore-service';

/**
 * Custom hook to synchronize state with a Firestore document.
 * @param collectionName The name of the Firestore collection.
 * @param docId The ID of the document within the collection.
 * @param initialValue The initial value to use if the document doesn't exist.
 * @returns A stateful value, and a function to update it.
 */
function useFirestore<T>(collectionName: string, docId: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const isSet = (value: any): value is Set<any> => value instanceof Set;

  // Function to serialize Set to Array for Firestore
  const serialize = (value: T) => {
    if (isSet(value)) {
      return Array.from(value);
    }
    return value;
  };

  // Function to deserialize Array to Set from Firestore
  const deserialize = (value: any): T => {
    if (isSet(initialValue) && Array.isArray(value)) {
      return new Set(value) as T;
    }
    return value;
  };

  // Memoize setValue to prevent re-renders
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prevValue => {
      const valueToStore = value instanceof Function ? value(prevValue) : value;
      const serializedData = { data: serialize(valueToStore) };
      saveDocument(collectionName, docId, serializedData).catch(console.error);
      return valueToStore;
    });
  }, [collectionName, docId]);

  // Effect to fetch initial data and subscribe to real-time updates
  useEffect(() => {
    if (typeof window === 'undefined' || !collectionName || !docId) return;

    // Fetch initial document
    getDocument<{ data: any }>(collectionName, docId).then(doc => {
      if (doc) {
        setStoredValue(deserialize(doc.data));
      } else {
        // If doc doesn't exist, create it with the initial value
        const serializedData = { data: serialize(initialValue) };
        saveDocument(collectionName, docId, serializedData).catch(console.error);
      }
      setIsInitialized(true);
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToDoc<{ data: any }>(collectionName, docId, (data) => {
      if (data) {
        const deserializedData = deserialize(data.data);
        setStoredValue(deserializedData);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collectionName, docId]); // Removed initialValue from deps to avoid re-subscribing on every render

  return [storedValue, setValue];
}

export default useFirestore;
