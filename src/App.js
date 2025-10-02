import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import './App.css';

// Import components
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import WalletSelector from './components/WalletSelector';

const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    borderRadius: 8,
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <WalletProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/student/*" element={<StudentDashboard />} />
              <Route path="/wallet" element={<WalletSelector />} />
            </Routes>
          </div>
        </Router>
      </WalletProvider>
    </ConfigProvider>
  );
}

export default App;