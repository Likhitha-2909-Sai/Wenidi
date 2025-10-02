import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Button, Card, message, Spin, Alert, Space } from 'antd';
import { WalletOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const WalletSelector = () => {
  const navigate = useNavigate();
  const { wallets, connected, connect, disconnect, account, connecting } = useWallet();

  useEffect(() => {
    if (connected && account) {
      message.success('Wallet connected successfully!');
      // Redirect to login to choose user type
      navigate('/login');
    }
  }, [connected, account, navigate]);

  const handleConnect = async (walletName) => {
    try {
      await connect(walletName);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      message.error(`Failed to connect to ${walletName}. Please try again.`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      message.info('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="wallet-selector-container">
      <Card className="wallet-selector-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <WalletOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
          <h2 style={{ color: '#1890ff', margin: 0 }}>Connect Your Wallet</h2>
          <p style={{ color: '#666', margin: '8px 0' }}>
            Choose a wallet to connect to Wenidi
          </p>
        </div>

        {connected ? (
          <div style={{ textAlign: 'center' }}>
            <Alert
              message="Wallet Connected"
              description={
                <div>
                  <p>Successfully connected to your wallet</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {account?.address}
                  </p>
                </div>
              }
              type="success"
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: '16px' }}
            />
            <Space>
              <Button type="primary" onClick={handleBackToLogin}>
                Continue to Login
              </Button>
              <Button onClick={handleDisconnect}>
                Disconnect
              </Button>
            </Space>
          </div>
        ) : (
          <div>
            {wallets.length > 0 ? (
              <div>
                {wallets.map((wallet) => (
                  <Button
                    key={wallet.name}
                    className="wallet-button"
                    onClick={() => handleConnect(wallet.name)}
                    loading={connecting}
                    disabled={connecting}
                  >
                    <img 
                      src={wallet.icon} 
                      alt={wallet.name}
                      style={{ width: '24px', height: '24px' }}
                    />
                    Connect to {wallet.name}
                  </Button>
                ))}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Button 
                    type="link" 
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToLogin}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Alert
                  message="No Wallets Found"
                  description="Please install a supported wallet (like Petra) to continue."
                  type="warning"
                  style={{ marginBottom: '16px' }}
                />
                <Button onClick={() => window.open('https://petra.app/', '_blank')}>
                  Install Petra Wallet
                </Button>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
          <p>By connecting a wallet, you agree to the Terms of Service</p>
        </div>
      </Card>
    </div>
  );
};

export default WalletSelector;