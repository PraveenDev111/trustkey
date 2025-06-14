import Web3 from 'web3';
import UserAuthContract from '../contracts/UserAuth.json';
import { CONTRACT_ADDRESS } from '../config';

let web3;
let contractInstance;

// Initialize Web3
const initWeb3 = async () => {
  if (window.ethereum) {
    try {
      // Request account access if needed
      await window.ethereum.enable();
      
      // Create Web3 instance
      web3 = new Web3(window.ethereum);
      
      // Get network ID
      const networkId = await web3.eth.net.getId();
      
      // Get the contract instance
      const deployedNetwork = UserAuthContract.networks[networkId];
      contractInstance = new web3.eth.Contract(
        UserAuthContract.abi,
        deployedNetwork && deployedNetwork.address || CONTRACT_ADDRESS
      );
      
      return contractInstance;
    } catch (error) {
      console.error('Error initializing Web3:', error);
      throw error;
    }
  } else if (window.web3) {
    // Legacy dapp browsers
    web3 = new Web3(window.web3.currentProvider);
    contractInstance = new web3.eth.Contract(
      UserAuthContract.abi,
      CONTRACT_ADDRESS
    );
    return contractInstance;
  } else {
    // Non-dapp browsers
    console.error('No Web3 provider detected. Please install MetaMask!');
    throw new Error('No Web3 provider detected');
  }
};

// Get the Web3 instance
const getWeb3 = () => {
  if (!web3) {
    throw new Error('Web3 not initialized. Call initWeb3 first.');
  }
  return web3;
};

// Get the contract instance
const getContract = () => {
  if (!contractInstance) {
    throw new Error('Contract not initialized. Call initWeb3 first.');
  }
  return contractInstance;
};

export {
  initWeb3 as initContract, // Alias for backward compatibility
  getWeb3,
  getContract,
  web3 as web3Instance // Export the web3 instance
};

export default {
  initContract: initWeb3,
  getWeb3,
  getContract,
  web3Instance: web3
};
