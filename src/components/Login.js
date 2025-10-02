import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Button, Card, Radio, message, Spin } from 'antd';
import { UserOutlined, CrownOutlined, WalletOutlined } from '@ant-design/icons';

const Login = () => {
  const navigate = useNavigate();
  const { connected, account, connect, connecting } = useWallet();
  const [userType, setUserType] = useState('student');

  useEffect(() => {
    if (connected && account) {
      // Redirect based on user type
      if (userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    }
  }, [connected, account, userType, navigate]);

  const handleConnect = async () => {
    try {
      await connect();
      message.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (error.message.includes('not installed')) {
        message.error('Petra wallet not found. Please install Petra wallet extension.');
        // Optionally redirect to Petra website
        window.open('https://petra.app/', '_blank');
      } else {
        message.error('Failed to connect wallet. Please try again.');
      }
    }
  };

  const userTypeOptions = [
    {
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          Student
        </div>
      ),
      value: 'student',
    },
    {
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CrownOutlined />
          Admin
        </div>
      ),
      value: 'admin',
    },
  ];

  return (
    <div className="login-container">
      <Card className="login-form">
        <div className="login-logo">
          <h1 className="login-title">WENIDI</h1>
          <p className="login-subtitle">Decentralized Attendance System</p>
        </div>

        <div className="user-type-selector">
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>Select User Type:</p>
          <Radio.Group
            options={userTypeOptions}
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            style={{ width: '100%' }}
            buttonStyle="solid"
          />
        </div>

        <Button
          type="primary"
          size="large"
          icon={<WalletOutlined />}
          onClick={handleConnect}
          loading={connecting}
          style={{ width: '100%', height: '48px', fontSize: '16px' }}
        >
          {connecting ? 'Connecting...' : 'Connect Petra Wallet'}
        </Button>

        <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '12px', margin: '8px 0' }}>
            Make sure you have Petra wallet installed
          </p>
          <p style={{ fontSize: '12px', margin: 0 }}>
            Login as {userType === 'admin' ? 'Admin' : 'Student'}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;