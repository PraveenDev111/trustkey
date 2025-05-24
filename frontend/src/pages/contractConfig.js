// src/contractConfig.js
import contractJson from '../PKIAuth.json';


const contractABI = contractJson.abi;
const contractAddress = contractJson.networks['5777'].address; // Replace '5777' with your network ID if different

export { contractABI, contractAddress };
