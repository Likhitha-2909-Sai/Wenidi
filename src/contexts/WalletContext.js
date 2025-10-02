// src/contexts/WalletContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { connectPetraWallet, disconnectPetraWallet, isWalletConnected, getAccount } from '../utils/wallet';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const isConnected = await isWalletConnected();
      if (isConnected) {
        const accountData = await getAccount();
        if (accountData) {
          setAccount({ address: accountData.address });
          setConnected(true);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  const connect = async () => {
    setConnecting(true);
    try {
      const result = await connectPetraWallet();
      if (result.success) {
        setAccount({ address: result.address });
        setConnected(true);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await disconnectPetraWallet();
      setAccount(null);
      setConnected(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Mock wallets array for compatibility
  const wallets = [
    {
      name: 'Petra',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCAxMkwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDEyTDEwLjkxIDguMjZMMTIgMloiIGZpbGw9IiNGRjc4NDMiLz4KPC9zdmc+',
      url: 'https://petra.app/'
    }
  ];

  const value = {
    account,
    connected,
    connecting,
    connect,
    disconnect,
    wallets
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};