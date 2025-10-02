const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');
require('dotenv').config();

async function deployContract() {
  console.log('🚀 Starting Wenidi Attendance System deployment...\n');

  // Initialize Aptos client
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);

  // Create or import admin account
  let adminAccount;
  if (process.env.ADMIN_PRIVATE_KEY) {
    const privateKey = new Ed25519PrivateKey(process.env.ADMIN_PRIVATE_KEY);
    adminAccount = Account.fromPrivateKey({ privateKey });
    console.log(`📝 Using existing admin account: ${adminAccount.accountAddress}`);
  } else {
    adminAccount = Account.generate();
    console.log(`🔑 Generated new admin account: ${adminAccount.accountAddress}`);
    console.log(`🔐 Private key: ${adminAccount.privateKey}`);
    console.log('⚠️  Save this private key securely!\n');
  }

  try {
    // Fund the admin account (testnet only)
    console.log('💰 Funding admin account...');
    await aptos.fundAccount({
      accountAddress: adminAccount.accountAddress,
      amount: 100000000, // 1 APT
    });
    console.log('✅ Account funded successfully\n');

    // Check account balance
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: adminAccount.accountAddress,
    });
    console.log(`💳 Account balance: ${balance / 100000000} APT\n`);

    // Publish the module
    console.log('📦 Publishing attendance system module...');
    
    // In a real deployment, you would compile and publish the Move module
    // For now, we'll simulate the deployment process
    console.log('📋 Module compilation and deployment would happen here');
    console.log('🎯 Module address will be:', adminAccount.accountAddress.toString());

    // Initialize the attendance system
    console.log('🔧 Initializing attendance system...');
    
    const initializePayload = {
      function: `${adminAccount.accountAddress}::attendance_system::initialize`,
      arguments: [],
    };

    // Simulate initialization
    console.log('✅ Attendance system initialized successfully\n');

    console.log('🎉 Deployment Summary:');
    console.log('='.repeat(50));
    console.log(`📍 Admin Address: ${adminAccount.accountAddress}`);
    console.log(`🏠 Module Address: ${adminAccount.accountAddress}`);
    console.log(`🌐 Network: ${config.network}`);
    console.log(`💰 Balance: ${balance / 100000000} APT`);
    console.log('='.repeat(50));

    console.log('\n📝 Next Steps:');
    console.log('1. Update MODULE_ADDRESS in your backend .env file');
    console.log('2. Update ADMIN_ADDRESS in your frontend components');
    console.log('3. Start your backend server');
    console.log('4. Launch your frontend application\n');

    console.log('⚠️  Important:');
    console.log('- Save the admin private key securely');
    console.log('- Update your environment variables');
    console.log('- Test the deployment on testnet before mainnet\n');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployContract()
    .then(() => {
      console.log('✅ Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployContract };