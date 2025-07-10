
"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isSet = (value: any): value is Set<any> => value instanceof Set;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        if (isSet(initialValue)) {
          // Ensure the parsed item is an array before creating a Set from it.
          // This prevents crashes if a Set was improperly stored as an empty object '{}'.
          if (Array.isArray(parsedItem)) {
            return new Set(parsedItem) as T;
          }
          // If the stored value is corrupted or not an array, fall back to the initial value.
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
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        let storableValue = valueToStore;
        // If the value is a Set, convert it to an Array before storing.
        if (isSet(valueToStore)) {
            storableValue = Array.from(valueToStore) as any;
        }
        window.localStorage.setItem(key, JSON.stringify(storableValue));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

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

  return [storedValue, setValue];
}

export default useLocalStorage;
