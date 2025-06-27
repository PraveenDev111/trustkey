require('dotenv').config();
const { ethers } = require('ethers');
const UserAuthABI = require('../../truffle-pkibckckn/build/contracts/UserAuth.json').abi;
const UserCertificateManagerABI = require('../../truffle-pkibckckn/build/contracts/UserCertificateManager.json').abi;

const { RPC_URL, CONTRACT_ADDRESS, PRIVATE_KEY } = process.env;

if (!RPC_URL || !CONTRACT_ADDRESS || !PRIVATE_KEY) {
  throw new Error('RPC_URL, CONTRACT_ADDRESS, and PRIVATE_KEY must be set in the .env file');
}

// Initialize provider using ethers
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// Create a wallet instance from the private key
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
console.log('Using wallet address:', wallet.address);

// Initialize contracts with signer
const userCertificateManagerContract = new ethers.Contract(
  CONTRACT_ADDRESS, 
  UserCertificateManagerABI,
  wallet // Use the wallet as the signer
);

// Function to get a contract instance with a specific signer
const getContractWithSigner = (privateKey) => {
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, UserCertificateManagerABI, wallet);
};

module.exports = { 
  provider,
  wallet,
  userCertificateManagerContract,
  getContractWithSigner
};