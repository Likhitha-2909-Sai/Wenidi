// src/context/WalletContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  WalletProvider as AptosWalletProvider,
  useWallet 
} from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from '@aptos-labs/wallet-adapter-petra-plugin';
import { PontemWallet } from '@aptos-labs/wallet-adapter-pontem-plugin';
import { MartianWallet } from '@aptos-labs/wallet-adapter-martian-plugin';
import AptosService from '../services/aptosService';

const WalletContext = createContext();

// Wallet configuration
const wallets = [
  new PetraWallet(),
  new PontemWallet(),
  new MartianWallet(),
];

// Wallet Context Provider Component
export const WalletContextProvider = ({ children }) => {
  const {
    connect,
    disconnect,
    account,
    connected,
    wallet,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
  } = useWallet();

  const [userType, setUserType] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize user data when wallet connects
  useEffect(() => {
    if (connected && account) {
      loadUserInfo();
    } else {
      setUserInfo(null);
      setUserType(null);
    }
  }, [connected, account]);

  const loadUserInfo = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const result = await AptosService.getUserInfo(account.address);
      if (result.success) {
        setUserInfo(result.data);
        // Map user type number to string
        const typeMap = { 1: 'student', 2: 'teacher', 3: 'admin' };
        setUserType(typeMap[result.data.userType]);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      await connect();
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      setUserInfo(null);
      setUserType(null);
      setError(null);
    } catch (error) {
      console.error('Wallet disconnect error:', error);
    }
  };

  const registerUser = async (name, type) => {
    if (!account) {
      setError('Please connect your wallet first');
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await AptosService.registerUser(account, name, type);
      if (result.success) {
        setUserType(type);
        await loadUserInfo();
      }
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to register user');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (userAddress, date, isPresent) => {
    if (!account) {
      setError('Please connect your wallet first');
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await AptosService.markAttendance(account, userAddress, date, isPresent);
      return result;
    } catch (error) {
      console.error('Mark attendance error:', error);
      setError('Failed to mark attendance');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const markCheckout = async (date) => {
    if (!account) {
      setError('Please connect your wallet first');
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await AptosService.markCheckout(account, date);
      return result;
    } catch (error) {
      console.error('Mark checkout error:', error);
      setError('Failed to mark checkout');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUserAttendance = async (userAddress, date) => {
    try {
      const result = await AptosService.getUserAttendance(userAddress, date);
      return result;
    } catch (error) {
      console.error('Get user attendance error:', error);
      return { success: false, error: error.message };
    }
  };

  const getDailyAttendance = async (date) => {
    try {
      const result = await AptosService.getDailyAttendance(date);
      return result;
    } catch (error) {
      console.error('Get daily attendance error:', error);
      return { success: false, error: error.message };
    }
  };

  const clearError = () => setError(null);

  const contextValue = {
    // Wallet state
    connected,
    account,
    wallet,
    userType,
    userInfo,
    loading,
    error,

    // Wallet actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    
    // Smart contract actions
    registerUser,
    markAttendance,
    markCheckout,
    getUserAttendance,
    getDailyAttendance,

    // Utility actions
    clearError,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletContextProvider');
  }
  return context;
};

// Main Wallet Provider wrapper
export const WalletProvider = ({ children }) => {
  return (
    <AptosWalletProvider wallets={wallets} autoConnect={true}>
      <WalletContextProvider>
        {children}
      </WalletContextProvider>
    </AptosWalletProvider>
  );
};

export default WalletProvider;