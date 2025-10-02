// src/utils/wallet.js - Simple Petra Wallet Integration

export const connectPetraWallet = async () => {
  try {
    // Check if Petra wallet is installed
    if (!window.aptos) {
      throw new Error('Petra wallet is not installed. Please install Petra wallet extension.');
    }

    // Connect to Petra wallet
    const response = await window.aptos.connect();
    
    console.log('Wallet connected:', response);
    
    return {
      success: true,
      address: response.address,
      publicKey: response.publicKey,
      authKey: response.authKey
    };
  } catch (error) {
    console.error('Wallet connection failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const disconnectPetraWallet = async () => {
  try {
    if (window.aptos) {
      await window.aptos.disconnect();
    }
    return { success: true };
  } catch (error) {
    console.error('Disconnect failed:', error);
    return { success: false, error: error.message };
  }
};

export const isWalletConnected = async () => {
  try {
    if (window.aptos) {
      return await window.aptos.isConnected();
    }
    return false;
  } catch (error) {
    console.error('Failed to check wallet connection:', error);
    return false;
  }
};

export const getAccount = async () => {
  try {
    if (window.aptos) {
      return await window.aptos.account();
    }
    return null;
  } catch (error) {
    console.error('Failed to get account:', error);
    return null;
  }
};

export const signAndSubmitTransaction = async (payload) => {
  try {
    if (!window.aptos) {
      throw new Error('Petra wallet not found');
    }
    
    const response = await window.aptos.signAndSubmitTransaction(payload);
    return { success: true, hash: response.hash };
  } catch (error) {
    console.error('Transaction failed:', error);
    return { success: false, error: error.message };
  }
};