
"use client";

import { useState, useEffect, useCallback } from 'react';

// Helper function to check if a value is a Set
function isSet<T>(value: any): value is Set<T> {
  return value instanceof Set;
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        // If the initial value was a Set, rehydrate the parsed array back into a Set.
        if (isSet(initialValue)) {
           // Ensure the parsed item is an array before creating a Set from it.
          if (Array.isArray(parsedItem)) {
            return new Set(parsedItem) as T;
          }
          // If the stored value is corrupted (not an array), return the initial value.
          return initialValue;
        }
        return parsedItem;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
          // If the value is a Set, convert it to an array before stringifying.
          if (isSet(valueToStore)) {
            window.localStorage.setItem(key, JSON.stringify(Array.from(valueToStore)));
          } else {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
        }
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          if (e.newValue) {
            const parsedItem = JSON.parse(e.newValue);
             // If the initial value was a Set, rehydrate the parsed array back into a Set.
            if (isSet(initialValue)) {
              if (Array.isArray(parsedItem)) {
                setStoredValue(new Set(parsedItem));
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

  return [storedValue, setValue];
}

export default useLocalStorage;
