require('dotenv').config();
const { JsonRpcProvider, Contract } = require('ethers');
const UserAuthABI = require('../../truffle-pkibckckn/build/contracts/UserAuth.json').abi;
const UserCertificateManagerABI = require('../../truffle-pkibckckn/build/contracts/UserCertificateManager.json').abi;

const { RPC_URL, CONTRACT_ADDRESS } = process.env;

if (!RPC_URL || !CONTRACT_ADDRESS) {
  throw new Error('RPC_URL and CONTRACT_ADDRESS must be set in the .env file');
}

// A simple check to remind the user to replace the placeholder


const provider = new JsonRpcProvider(RPC_URL);
//const userAuthContract = new Contract(CONTRACT_ADDRESS, UserAuthABI, provider);
const userCertificateManagerContract = new Contract(CONTRACT_ADDRESS, UserCertificateManagerABI, provider);
module.exports = { userCertificateManagerContract };
