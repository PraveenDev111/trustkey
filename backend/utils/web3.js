require('dotenv').config();
const { ethers } = require('ethers');
const UserAuthABI = require('../../truffle-pkibckckn/build/contracts/UserAuth.json').abi;
const UserCertificateManagerABI = require('../../truffle-pkibckckn/build/contracts/UserCertificateManager.json').abi;

const { RPC_URL, CONTRACT_ADDRESS } = process.env;

if (!RPC_URL || !CONTRACT_ADDRESS) {
  throw new Error('RPC_URL and CONTRACT_ADDRESS must be set in the .env file');
}

// Initialize provider using ethers
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// Initialize contracts
const userCertificateManagerContract = new ethers.Contract(
  CONTRACT_ADDRESS, 
  UserCertificateManagerABI, 
  provider
);

module.exports = { 
  provider,
  userCertificateManagerContract 
};