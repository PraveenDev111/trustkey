import Web3 from 'web3';
import UserCertificateManagerABI from './contracts/UserCertificateManager.json';
import { CONTRACT_ADDRESS } from './config';

let web3Instance;
let contractInstance;
let certificateManagerInstance;

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
        
        // Initialize contract instance
        contractInstance = new web3Instance.eth.Contract(
          UserCertificateManagerABI.abi,
          CONTRACT_ADDRESS
        );
        
        // Alias for backward compatibility
        certificateManagerInstance = contractInstance;
        
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
  console.log('Starting contract initialization...');
  if (!web3Instance) {
    console.log('Web3 instance not initialized');
    await initWeb3();
  }

  try {
    console.log('Creating contract instance with ABI and address:', CONTRACT_ADDRESS);
    
    const contract = new web3Instance.eth.Contract(
      UserCertificateManagerABI.abi,
      CONTRACT_ADDRESS
    );

    console.log('Checking if contract is deployed...');
    const code = await web3Instance.eth.getCode(CONTRACT_ADDRESS);
    
    if (code === '0x') {
      console.error('Contract not deployed at address:', CONTRACT_ADDRESS);
      return null;
    }

    console.log('Testing contract methods...');
    try {
      // Test with isUserRegistered using a zero address
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      const isRegistered = await contract.methods.isUserRegistered(zeroAddress).call();
      console.log('Test call to isUserRegistered successful. Result:', isRegistered);
    } catch (methodError) {
      console.error('Error calling contract method:', methodError);
      return null;
    }

    console.log('Contract initialized successfully');
    return contract;
  } catch (error) {
    console.error('Error in initContract:', error);
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

// User Management
export const registerUser = async (email, username, publicKey, from) => {
  try {
    const result = await contractInstance.methods
      .registerUser(email, username, publicKey)
      .send({ from });
    return result;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const isUserRegistered = async (address) => {
  try {
    return await contractInstance.methods.isUserRegistered(address).call();
  } catch (error) {
    console.error('Error checking user registration:', error);
    throw error;
  }
};

// Public Key Management
export const addPublicKey = async (keyData, from) => {
  try {
    const result = await contractInstance.methods
      .addPublicKey(keyData)
      .send({ from });
    return result;
  } catch (error) {
    console.error('Error adding public key:', error);
    throw error;
  }
};

export const deactivatePublicKey = async (keyIndex, from) => {
  try {
    const result = await contractInstance.methods
      .deactivatePublicKey(keyIndex)
      .send({ from });
    return result;
  } catch (error) {
    console.error('Error deactivating public key:', error);
    throw error;
  }
};

export const getActivePublicKey = async (userAddress) => {
  try {
    return await contractInstance.methods.getActivePublicKey(userAddress).call();
  } catch (error) {
    console.error('Error getting active public key:', error);
    throw error;
  }
};

export const getUserPublicKeys = async (userAddress) => {
  try {
    return await contractInstance.methods.getUserPublicKeys(userAddress).call();
  } catch (error) {
    console.error('Error getting user public keys:', error);
    throw error;
  }
};

// Certificate Management
export const issueCertificate = async (certData, from) => {
  try {
    const result = await contractInstance.methods
      .issueCertificate(
        certData.serialNumber,
        certData.country,
        certData.state,
        certData.locality,
        certData.organization,
        certData.commonName,
        certData.publicKey,
        certData.signatureAlgorithm,
        certData.validDays
      )
      .send({ from });
    return result;
  } catch (error) {
    console.error('Error issuing certificate:', error);
    throw error;
  }
};

export const revokeCertificate = async (reason, from) => {
  try {
    const result = await contractInstance.methods
      .revokeCertificate(reason)
      .send({ from });
    return result;
  } catch (error) {
    console.error('Error revoking certificate:', error);
    throw error;
  }
};

export const getCertificateInfo = async (userAddress) => {
  try {
    return await contractInstance.methods.getCertificateInfo(userAddress).call();
  } catch (error) {
    console.error('Error getting certificate info:', error);
    throw error;
  }
};

// Authentication
export const generateChallenge = async (userAddress) => {
  try {
    return await contractInstance.methods.generateChallenge(userAddress).call();
  } catch (error) {
    console.error('Error generating challenge:', error);
    throw error;
  }
};

export const verifySolution = async (userAddress, solution, from) => {
  try {
    return await contractInstance.methods
      .verifySolution(userAddress, solution)
      .call({ from });
  } catch (error) {
    console.error('Error verifying solution:', error);
    throw error;
  }
};

// Export web3 instance and contract instance
export { web3Instance, contractInstance, certificateManagerInstance };
