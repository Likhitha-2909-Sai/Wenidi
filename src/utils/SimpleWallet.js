// SimpleWallet.js - Use this if wallet adapters still cause issues
// Place this file in src/utils/SimpleWallet.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Simple Petra wallet connection utility
export const connectPetraWallet = async () => {
  try {
    // Check if Petra is installed
    if (!window.aptos) {
      throw new Error('Petra wallet not installed. Please install Petra wallet extension.');
    }

    // Connect to wallet
    const response = await window.aptos.connect();
    
    return {
      success: true,
      address: response.address,
      publicKey: response.publicKey
    };
  } catch (error) {
    console.error('Wallet connection error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Simple wallet provider (alternative to complex wallet adapter)
export const SimpleWalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connect = async (walletName = 'Petra') => {
    setConnecting(true);
    try {
      const result = await connectPetraWallet();
      if (result.success) {
        setAccount({ address: result.address, publicKey: result.publicKey });
        setConnected(true);
        return true;
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
      if (window.aptos) {
        await window.aptos.disconnect();
      }
      setAccount(null);
      setConnected(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.aptos) {
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            setAccount({ 
              address: account.address, 
              publicKey: account.publicKey 
            });
            setConnected(true);
          }
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Mock wallets array for compatibility with existing code
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

export default SimpleWalletProvider;