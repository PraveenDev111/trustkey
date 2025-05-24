//all codes to insert create o update users on blockchain - ganache - truffle

const accounts = await web3.eth.getAccounts();


const pki = await PKIAuth.deployed();

const email = "alice@example.com";
const username = "alice";
const publicKeyHex = "0x1234567890abcdef"; // Replace with actual public key in hex
const publicKeyBytes = web3.utils.hexToBytes(publicKeyHex);

await pki.registerPublicKey(email, username, publicKeyBytes, { from: accounts[0] });

const isRegistered = await pki.isUserRegistered(accounts[0]);
console.log("User Registered:", isRegistered);

const [retrievedUsername, publicKeys] = await pki.getUserDetails(accounts[0]);
console.log("Username:", retrievedUsername);
console.log("Public Keys:", publicKeys);


await web3.eth.getBalance(accounts[4]);

//truffle exec list.js
// to 
