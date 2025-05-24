import Web3 from 'web3';
import PKIAuthABI from './contracts/PKIAuth.json';

// Contract address from deployment
const CONTRACT_ADDRESS = '0x76E4D076eBF8Bbf5382E10c15FdE186D9193ea5f';

let web3Instance;
let contractInstance;

// Initialize web3
export const initWeb3 = async () => {
  console.log('Initializing web3...');
  
  if (window.ethereum) {
    console.log('Web3 provider detected');
    try {
      // Request account access if needed
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected accounts:', accounts);
      
      // Modern dapp browsers...
      web3Instance = new Web3(window.ethereum);
      
      // Get network details
      const networkId = await web3Instance.eth.net.getId();
      const networkType = await web3Instance.eth.net.getNetworkType();
      console.log('Connected to network:', networkType, 'ID:', networkType);
      
      // Get balance of first account
      const balance = await web3Instance.eth.getBalance(accounts[0]);
      console.log('Account balance:', web3Instance.utils.fromWei(balance, 'ether'), 'ETH');
      
      return true;
    } catch (error) {
      console.error('Error connecting to web3:', error);
      return false;
    }
  } else if (window.web3) {
    console.log('Legacy web3 provider detected');
    web3Instance = new Web3(window.web3.currentProvider);
    return true;
  } else {
    console.log('No web3 provider detected');
    return false;
  }
};

// Get Web3 utils
export const getWeb3Utils = () => {
  return web3Instance.utils;
};

// Initialize contract
export const initContract = async () => {
  if (!web3Instance) {
    console.error('Web3 not initialized');
    return null;
  }

  try {
    console.log('Initializing contract at address:', CONTRACT_ADDRESS);
    
    // Create contract instance
    const contract = new web3Instance.eth.Contract(
      PKIAuthABI.abi,
      CONTRACT_ADDRESS
    );

    // Verify contract is deployed
    const code = await web3Instance.eth.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.error('Contract not deployed at address:', CONTRACT_ADDRESS);
      return null;
    }

    // Test contract connection
    try {
      const contractName = await contract.methods.name().call();
      console.log('Contract connected successfully:', contractName);
    } catch (error) {
      console.error('Error testing contract connection:', error);
      return null;
    }

    console.log('Contract initialized successfully');
    return contract;
  } catch (error) {
    console.error('Error initializing contract:', error);
    return null;
  }
};

// Get current account
export const getCurrentAccount = async () => {
  if (!web3Instance) {
    console.error('Web3 not initialized');
    return null;
  }

  try {
    const accounts = await web3Instance.eth.getAccounts();
    if (accounts.length === 0) {
      console.error('No accounts connected');
      return null;
    }
    const account = accounts[0];
    console.log('Current account:', account);
    return account;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

// Export web3 instance
export { web3Instance, contractInstance };
