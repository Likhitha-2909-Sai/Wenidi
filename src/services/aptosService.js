// src/services/aptosService.js
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET // Change to MAINNET for production
});
const aptos = new Aptos(aptosConfig);

// Contract address (replace with your deployed contract address)
const MODULE_ADDRESS = "0x845fb204faa0c5c6134194e9307989763adbcdb26c8b877354deb363f08485db"; // Replace with actual deployed address
const MODULE_NAME = "attendance_system";

class AptosService {
  constructor() {
    this.aptos = aptos;
    this.moduleAddress = MODULE_ADDRESS;
  }

  // Initialize the attendance system
  async initializeSystem(account) {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${this.moduleAddress}::${MODULE_NAME}::initialize`,
          functionArguments: [],
        },
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      return {
        success: true,
        hash: executedTransaction.hash,
      };
    } catch (error) {
      console.error("Error initializing system:", error);
      return { success: false, error: error.message };
    }
  }

  // Register a new user
  async registerUser(account, name, userType) {
    try {
      // Convert user type to number
      const userTypeMap = {
        'student': 1,
        'teacher': 2,
        'admin': 3
      };

      const transaction = await this.aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${this.moduleAddress}::${MODULE_NAME}::register_user`,
          functionArguments: [name, userTypeMap[userType]],
        },
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      return {
        success: true,
        hash: executedTransaction.hash,
      };
    } catch (error) {
      console.error("Error registering user:", error);
      return { success: false, error: error.message };
    }
  }

  // Mark attendance
  async markAttendance(account, userAddress, date, isPresent) {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${this.moduleAddress}::${MODULE_NAME}::mark_attendance`,
          functionArguments: [userAddress, date, isPresent],
        },
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      return {
        success: true,
        hash: executedTransaction.hash,
      };
    } catch (error) {
      console.error("Error marking attendance:", error);
      return { success: false, error: error.message };
    }
  }

  // Mark checkout
  async markCheckout(account, date) {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: `${this.moduleAddress}::${MODULE_NAME}::mark_checkout`,
          functionArguments: [date],
        },
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      return {
        success: true,
        hash: executedTransaction.hash,
      };
    } catch (error) {
      console.error("Error marking checkout:", error);
      return { success: false, error: error.message };
    }
  }

  // Get user information
  async getUserInfo(userAddress) {
    try {
      const userInfo = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::${MODULE_NAME}::get_user_info`,
          functionArguments: [userAddress],
        },
      });

      return {
        success: true,
        data: {
          address: userInfo[0].address,
          name: userInfo[0].name,
          userType: userInfo[0].user_type,
          registrationTime: userInfo[0].registration_time,
        },
      };
    } catch (error) {
      console.error("Error getting user info:", error);
      return { success: false, error: error.message };
    }
  }

  // Get user attendance for a specific date
  async getUserAttendance(userAddress, date) {
    try {
      const attendance = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::${MODULE_NAME}::get_user_attendance`,
          functionArguments: [userAddress, date],
        },
      });

      return {
        success: true,
        data: {
          userAddress: attendance[0].user_address,
          date: attendance[0].date,
          checkInTime: attendance[0].check_in_time,
          checkOutTime: attendance[0].check_out_time,
          isPresent: attendance[0].is_present,
          markedBy: attendance[0].marked_by,
        },
      };
    } catch (error) {
      console.error("Error getting user attendance:", error);
      return { success: false, error: error.message };
    }
  }

  // Get daily attendance (admin only)
  async getDailyAttendance(date) {
    try {
      const attendance = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::${MODULE_NAME}::get_daily_attendance`,
          functionArguments: [date],
        },
      });

      return {
        success: true,
        data: attendance[0].map(record => ({
          userAddress: record.user_address,
          date: record.date,
          checkInTime: record.check_in_time,
          checkOutTime: record.check_out_time,
          isPresent: record.is_present,
          markedBy: record.marked_by,
        })),
      };
    } catch (error) {
      console.error("Error getting daily attendance:", error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is registered
  async isUserRegistered(userAddress) {
    try {
      const isRegistered = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::${MODULE_NAME}::is_user_registered`,
          functionArguments: [userAddress],
        },
      });

      return {
        success: true,
        data: isRegistered[0],
      };
    } catch (error) {
      console.error("Error checking user registration:", error);
      return { success: false, error: error.message };
    }
  }

  // Get admin address
  async getAdminAddress() {
    try {
      const adminAddress = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::${MODULE_NAME}::get_admin_address`,
          functionArguments: [],
        },
      });

      return {
        success: true,
        data: adminAddress[0],
      };
    } catch (error) {
      console.error("Error getting admin address:", error);
      return { success: false, error: error.message };
    }
  }

  // Get account balance
  async getAccountBalance(address) {
    try {
      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress: address,
      });

      return {
        success: true,
        data: balance,
      };
    } catch (error) {
      console.error("Error getting account balance:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new AptosService();