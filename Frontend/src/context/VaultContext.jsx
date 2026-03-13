import React, { createContext, useContext, useState } from 'react';

/* ── Single source of truth for vault data ── */
const INITIAL_VAULT = []; // Start empty - data loaded from backend API

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [vault, setVault] = useState(INITIAL_VAULT);

  function toggleFavorite(id) {
    setVault(prev =>
      prev.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item)
    );
  }

  function deleteItem(id) {
    setVault(prev => prev.filter(item => item.id !== id));
  }

  const favorites = vault.filter(v => v.favorite);

  return (
    <VaultContext.Provider value={{ vault, setVault, toggleFavorite, deleteItem, favorites }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  return ctx || { vault: [], setVault: () => {}, toggleFavorite: () => {}, deleteItem: () => {}, favorites: [] };
}