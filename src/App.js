import React, { useState, useEffect } from 'react';
import './App.css';

// Safe JSON parser to prevent parsing errors
const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Raw data:', str);
    return fallback;
  }
};

// Safe API fetch function
const safeApiFetch = async (url, options = {}) => {
  try {
    console.log('Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    // Check if response looks like JSON
    if (responseText.trim() && !responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
      console.warn('Response does not appear to be JSON:', responseText);
      return { error: 'Invalid JSON response', data: responseText };
    }
    
    const data = safeJSONParse(responseText, { error: 'Failed to parse JSON', raw: responseText });
    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    return { error: error.message };
  }
};

// Main App Component
function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Safe wallet connection function
  const connectWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check if wallet is available
      if (typeof window.ethereum !== 'undefined') {
        // MetaMask or other wallet
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          console.log('Wallet connected:', accounts[0]);
        }
      } else if (typeof window.aptos !== 'undefined') {
        // Aptos wallet
        const walletResponse = await window.aptos.connect();
        console.log('Aptos wallet response:', walletResponse);
        
        if (walletResponse && walletResponse.address) {
          setWalletAddress(walletResponse.address);
          setWalletConnected(true);
        }
      } else {
        throw new Error('No wallet found. Please install MetaMask or an Aptos wallet.');
      }
    } catch (err) {
      setError(err.message);
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance function
  const markAttendance = async () => {
    if (!walletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock attendance marking - replace with actual blockchain call
      const attendanceRecord = {
        address: walletAddress,
        timestamp: new Date().toISOString(),
        status: 'present',
        id: Date.now()
      };

      // Add to attendance data
      setAttendanceData(prev => [...prev, attendanceRecord]);
      
      console.log('Attendance marked:', attendanceRecord);
    } catch (err) {
      setError(err.message);
      console.error('Attendance marking error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError('');

    try {
      // Mock API call - replace with actual API endpoint
      const data = await safeApiFetch('/api/attendance');
      
      if (data && !data.error) {
        // Safely handle the response
        const records = Array.isArray(data) ? data : (data.data ? data.data : []);
        setAttendanceData(records);
      } else {
        console.warn('No attendance data or error in response:', data);
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
      // Don't set error for mock API failure
    } finally {
      setLoading(false);
    }
  };

  // Effect to load initial data
  useEffect(() => {
    // Check if wallet was previously connected
    const checkWalletConnection = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setWalletConnected(true);
          }
        }
      } catch (err) {
        console.error('Initial wallet check error:', err);
      }
    };

    checkWalletConnection();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🎓 Wenidi Attendance System</h1>
          <p>Blockchain-based attendance management</p>
        </header>

        <div className="main-content">
          {/* Wallet Connection Section */}
          <div className="wallet-section">
            <h2>Wallet Connection</h2>
            {!walletConnected ? (
              <button 
                onClick={connectWallet} 
                disabled={loading}
                className="connect-button"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="wallet-info">
                <p>✅ Wallet Connected</p>
                <p className="wallet-address">
                  Address: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
                <button 
                  onClick={() => {
                    setWalletConnected(false);
                    setWalletAddress('');
                  }}
                  className="disconnect-button"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Attendance Section */}
          <div className="attendance-section">
            <h2>Mark Attendance</h2>
            <button 
              onClick={markAttendance}
              disabled={loading || !walletConnected}
              className="attendance-button"
            >
              {loading ? 'Marking...' : 'Mark Present'}
            </button>
            
            <button 
              onClick={fetchAttendanceData}
              disabled={loading}
              className="fetch-button"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={() => setError('')}>Clear Error</button>
            </div>
          )}

          {/* Attendance Records */}
          <div className="records-section">
            <h2>Attendance Records</h2>
            {attendanceData.length > 0 ? (
              <div className="records-list">
                {attendanceData.map((record, index) => (
                  <div key={record.id || index} className="record-item">
                    <p><strong>Address:</strong> {record.address?.slice(0, 6)}...{record.address?.slice(-4) || 'N/A'}</p>
                    <p><strong>Time:</strong> {new Date(record.timestamp).toLocaleString()}</p>
                    <p><strong>Status:</strong> {record.status || 'present'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No attendance records found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;