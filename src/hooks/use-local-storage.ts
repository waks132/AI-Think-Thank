// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isSet = (value: any): value is Set<any> => value instanceof Set;

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Use a ref to store the setter function to avoid dependency issues in useEffect
  const setValueRef = useRef((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        let storableValue = valueToStore;
        if (isSet(valueToStore)) {
            storableValue = Array.from(valueToStore) as any;
        }
        window.localStorage.setItem(key, JSON.stringify(storableValue));
      }
    } catch (error) {
      console.error(error);
    }
  });

  // This effect runs once on mount to read from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        if (isSet(initialValue) && Array.isArray(parsedItem)) {
          setStoredValue(new Set(parsedItem) as T);
        } else {
          setStoredValue(parsedItem);
        }
      } else {
         // If no item, set the initial value in localStorage
        let storableValue = initialValue;
        if (isSet(initialValue)) {
            storableValue = Array.from(initialValue) as any;
        }
        window.localStorage.setItem(key, JSON.stringify(storableValue));
      }
    } catch (error) {
      console.error(error);
      setStoredValue(initialValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only run on key change

  // This effect handles changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          if (e.newValue) {
            const parsedItem = JSON.parse(e.newValue);
             if (isSet(initialValue)) {
                if (Array.isArray(parsedItem)) {
                    setStoredValue(new Set(parsedItem) as T);
                }
             } else {
                setStoredValue(parsedItem);
             }
          } else {
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValueRef.current];
}

export default useLocalStorage;
