import Web3 from 'web3';
import UserAuthABI from './contracts/UserAuth.json';
//import { CONTRACT_ADDRESS } from './config'; // Adjust the import path as needed
// Contract address from deployment
import { CONTRACT_ADDRESS } from './config';

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
      
      // Create Web3 instance
      web3Instance = new Web3(window.ethereum);
      
      try {
        // Get network ID
        const networkId = await web3Instance.eth.getChainId();
        console.log('Connected to chain ID:', networkId);
        
        // Get network name (using a simple mapping as getNetworkType is not available)
        const networkMap = {
          1: 'Ethereum Mainnet',
          3: 'Ropsten',
          4: 'Rinkeby',
          5: 'Goerli',
          42: 'Kovan',
          1337: 'Localhost',
          5777: 'Ganache'
        };
        
        const networkName = networkMap[networkId] || `Unknown Network (${networkId})`;
        console.log('Connected to network:', networkName);
        
        // Get balance of first account
        const balance = await web3Instance.eth.getBalance(accounts[0]);
        console.log('Account balance:', web3Instance.utils.fromWei(balance, 'ether'), 'ETH');
        
        return true;
      } catch (error) {
        console.error('Error getting network info:', error);
        return false;
      }
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


export const initContract = async () => {
  console.log('1. Starting contract initialization...');
  if (!web3Instance) {
    console.log('Web3 instance not initialized');
    await initWeb3();
  }

  try {
    console.log('2. Creating contract instance with ABI and address:');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('ABI:', UserAuthABI.abi ? 'ABI loaded' : 'ABI missing');

    const contract = new web3Instance.eth.Contract(
      UserAuthABI.abi,
      CONTRACT_ADDRESS
    );

    console.log('3. Contract instance created, checking if deployed...');
    const code = await web3Instance.eth.getCode(CONTRACT_ADDRESS);
    console.log('Contract code at address:', code ? 'Exists' : 'Empty');
    
    if (code === '0x') {
      console.error('4. Contract not deployed at address:', CONTRACT_ADDRESS);
      return null;
    }

    console.log('5. Testing contract methods...');
    try {
      // Test with isUserRegistered using a zero address
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      const isRegistered = await contract.methods.isUserRegistered(zeroAddress).call();
      console.log('6. Test call to isUserRegistered successful. Result:', isRegistered);
    } catch (methodError) {
      console.error('7. Error calling contract method:', methodError);
      return null;
    }

    console.log('8. Contract initialized successfully');
    return contract;
  } catch (error) {
    console.error('9. Error in initContract:', error);
    return null;
  }
};
// Add this to your web3.js exports
export const addAccountFromPrivateKey = (privateKey) => {
  if (!web3Instance) {
    throw new Error('Web3 not initialized');
  }
  const account = web3Instance.eth.accounts.privateKeyToAccount(privateKey);
  web3Instance.eth.accounts.wallet.add(account);
  web3Instance.eth.defaultAccount = account.address;
  return account.address;
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
