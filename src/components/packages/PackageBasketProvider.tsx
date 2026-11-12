"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface PackageBasketItem {
  id: string;
  title: string;
  sizeLabel: string;
  condition: string;
  photoId: string | null;
}

interface PackageBasketContextValue {
  items: PackageBasketItem[];
  addItem: (item: PackageBasketItem) => void;
  removeItem: (itemId: string) => void;
  clearBasket: () => void;
  toggleItem: (item: PackageBasketItem) => void;
  isSelected: (itemId: string) => boolean;
  count: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PackageBasketContext = createContext<PackageBasketContextValue | null>(null);

const STORAGE_KEY = "kp:basket:v1";

export function PackageBasketProvider({ children, householdId }: { children: ReactNode; householdId: string }) {
  const [items, setItems] = useState<PackageBasketItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const storageKey = `${STORAGE_KEY}:${householdId}`;

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load package basket from sessionStorage:", e);
    }
  }, [storageKey]);

  // Persist to sessionStorage on changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save package basket to sessionStorage:", e);
    }
  }, [items, storageKey]);

  const addItem = useCallback((item: PackageBasketItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const clearBasket = useCallback(() => {
    setItems([]);
  }, []);

  const toggleItem = useCallback((item: PackageBasketItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const isSelected = useCallback((itemId: string) => {
    return items.some((i) => i.id === itemId);
  }, [items]);

  const value: PackageBasketContextValue = {
    items,
    addItem,
    removeItem,
    clearBasket,
    toggleItem,
    isSelected,
    count: items.length,
    isOpen,
    setIsOpen,
  };

  return <PackageBasketContext.Provider value={value}>{children}</PackageBasketContext.Provider>;
}

export function usePackageBasket() {
  const context = useContext(PackageBasketContext);
  if (!context) {
    throw new Error("usePackageBasket must be used within a PackageBasketProvider");
  }
  return context;
}