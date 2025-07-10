
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

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
          if (Array.isArray(parsedItem)) {
            return new Set(parsedItem) as T;
          }
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

  const setValueRef = useRef((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
          let storableValue = valueToStore;
          if (isSet(valueToStore)) {
              storableValue = Array.from(valueToStore) as any;
          }
          window.localStorage.setItem(key, JSON.stringify(storableValue));
        }
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  });

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
