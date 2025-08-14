#!/bin/bash
# deploy.sh - Deployment script for Wenidi Attendance System

set -e

echo "🚀 Starting deployment of Wenidi Attendance System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo -e "${RED}❌ Aptos CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli"
    exit 1
fi

echo -e "${GREEN}✅ Aptos CLI found${NC}"

# Check if we're in the right directory
if [ ! -f "Move.toml" ]; then
    echo -e "${RED}❌ Move.toml not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Initialize Aptos account if not exists
echo -e "${BLUE}🔐 Checking Aptos account...${NC}"
if [ ! -f ".aptos/config.yaml" ]; then
    echo -e "${YELLOW}⚠️ No Aptos account found. Creating new account...${NC}"
    aptos init --network testnet
else
    echo -e "${GREEN}✅ Aptos account found${NC}"
fi

# Compile the Move contract
echo -e "${BLUE}🔨 Compiling Move contract...${NC}"
if aptos move compile; then
    echo -e "${GREEN}✅ Contract compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

# Run Move tests
echo -e "${BLUE}🧪 Running Move tests...${NC}"
if aptos move test; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️ Some tests failed. Continue anyway? (y/n)${NC}"
    read -r response
    if [[ ! $response =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Publish the contract
echo -e "${BLUE}📦 Publishing contract to Aptos testnet...${NC}"
if aptos move publish --assume-yes; then
    echo -e "${GREEN}✅ Contract published successfully${NC}"
    
    # Get the account address
    ACCOUNT_ADDRESS=$(aptos account list --query balance --assume-yes | grep -o '0x[845fb204faa0c5c6134194e9307989763adbcdb26c8b877354deb363f08485db]*' | head -1)
    echo -e "${GREEN}📍 Contract deployed at address: $ACCOUNT_ADDRESS${NC}"
    
    # Update the frontend configuration
    echo -e "${BLUE}🔧 Updating frontend configuration...${NC}"
    if [ -f "src/services/aptosService.js" ]; then
        # Replace the MODULE_ADDRESS in the service file
        sed -i.bak "s/const MODULE_ADDRESS = \"0x42\"/const MODULE_ADDRESS = \"$ACCOUNT_ADDRESS\"/" src/services/aptosService.js
        rm src/services/aptosService.js.bak 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend configuration updated${NC}"
    fi
    
else
    echo -e "${RED}❌ Contract deployment failed${NC}"
    exit 1
fi

# Initialize the attendance system
echo -e "${BLUE}⚙️ Initializing attendance system...${NC}"
if aptos move run --function-id "$ACCOUNT_ADDRESS::attendance_system::initialize" --assume-yes; then
    echo -e "${GREEN}✅ Attendance system initialized${NC}"
else
    echo -e "${RED}❌ Failed to initialize attendance system${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "   Contract Address: $ACCOUNT_ADDRESS"
echo -e "   Network: Testnet"
echo -e "   Status: Active"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "   1. Update your frontend with the contract address: $ACCOUNT_ADDRESS"
echo -e "   2. Start the React development server: npm start"
echo -e "   3. Connect your wallet and register users"
echo ""
echo -e "${GREEN}🔗 Useful Links:${NC}"
echo -e "   • Aptos Explorer: https://explorer.aptoslabs.com/account/$ACCOUNT_ADDRESS?network=testnet"
echo -e "   • Aptos Faucet: https://aptoslabs.com/testnet-faucet"