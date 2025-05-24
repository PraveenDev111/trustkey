const { Web3 } = require('web3');
const fs = require('fs');

// Initialize Web3 connection to Ganache
const web3 = new Web3('http://127.0.0.1:8545');

// Load contract ABI and address
const contractJson = JSON.parse(fs.readFileSync('./build/contracts/PKIAuth.json', 'utf8'));
const contractABI = contractJson.abi;
const contractAddress = contractJson.networks['5777'].address; // Replace '5777' with your network ID if different

// Create contract instance
const pkiAuth = new web3.eth.Contract(contractABI, contractAddress);

// User details
const email = 'use3r@example.com';
const username = 'user333';
const publicKeyHex = '0x8C5D330C640e016B628e46A7D2923a500e751BAC'; // Replace with actual public key in hex format
const publicKeyBytes = web3.utils.hexToBytes(publicKeyHex);

async function registerUser() {
    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[2]; // Use the desired Ganache account

        const receipt = await pkiAuth.methods
            .registerPublicKey(email, username, publicKeyBytes)
            .send({ from: sender, gas: 200000 });

        console.log('Transaction successful:', receipt.transactionHash);
    } catch (error) {
        console.error('Registration failed:', error);
    }
}

registerUser();


