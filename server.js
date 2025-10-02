const express = require('express');
const cors = require('cors');
const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Aptos client
const config = new AptosConfig({ 
  network: Network.TESTNET // Use TESTNET for development
});
const aptos = new Aptos(config);

// Contract configuration
const MODULE_ADDRESS = process.env.MODULE_ADDRESS || "0xd0fdbd797a8aab8469bc90b1226aee6b4705763ebd2b4791f2953136c5c9bccc"; // Replace with deployed address
const MODULE_NAME = "attendance_system";

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Wenidi Backend is running' });
});

// Get all students
app.get('/api/students/:adminAddress', async (req, res) => {
  try {
    const { adminAddress } = req.params;
    
    const students = await aptos.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_students`,
      arguments: [adminAddress],
    });

    res.json({
      success: true,
      data: students[0] || []
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get student attendance records
app.get('/api/attendance/:adminAddress/:studentAddress', async (req, res) => {
  try {
    const { adminAddress, studentAddress } = req.params;
    
    const attendance = await aptos.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_student_attendance`,
      arguments: [adminAddress, studentAddress],
    });

    res.json({
      success: true,
      data: attendance[0] || []
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all attendance records (admin only)
app.get('/api/attendance/:adminAddress', async (req, res) => {
  try {
    const { adminAddress } = req.params;
    
    const attendance = await aptos.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_all_attendance`,
      arguments: [adminAddress],
    });

    res.json({
      success: true,
      data: attendance[0] || []
    });
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check if student is registered
app.get('/api/student/check/:adminAddress/:studentAddress', async (req, res) => {
  try {
    const { adminAddress, studentAddress } = req.params;
    
    const isRegistered = await aptos.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::is_student_registered`,
      arguments: [adminAddress, studentAddress],
    });

    res.json({
      success: true,
      isRegistered: isRegistered[0] || false
    });
  } catch (error) {
    console.error('Error checking student registration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system admin
app.get('/api/admin/:adminAddress', async (req, res) => {
  try {
    const { adminAddress } = req.params;
    
    const admin = await aptos.view({
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_admin`,
      arguments: [adminAddress],
    });

    res.json({
      success: true,
      admin: admin[0]
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Transaction status endpoint
app.get('/api/transaction/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    const transaction = await aptos.getTransactionByHash({
      transactionHash: hash,
    });

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get account transactions
app.get('/api/account/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const transactions = await aptos.getAccountTransactions({
      accountAddress: address,
      options: { limit }
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Wenidi Backend running on port ${PORT}`);
  console.log(`📡 Connected to Aptos ${config.network} network`);
  console.log(`🏠 Module Address: ${MODULE_ADDRESS}`);
});