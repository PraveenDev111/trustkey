import React, { useState } from "react";
import Web3 from "web3";

const Signup = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [ethAccount, setEthAccount] = useState(null);
    const [privateKey, setPrivateKey] = useState("");

    const web3 = new Web3("http://127.0.0.1:8545"); // Ganache RPC URL

    const generateEthereumAccount = async () => {
        const newAccount = web3.eth.accounts.create(); // Create a new Ethereum account

        setEthAccount(newAccount.address);
        setPrivateKey(newAccount.privateKey); // User should save this securely!
    };

    const registerOnBlockchain = async () => {
        if (!ethAccount) {
            alert("Please generate an Ethereum account first!");
            return;
        }

        const contractAddress = "0xEc70747b5b5DE6C4E140F8e10723d7Edf5199976"; // Replace with deployed contract address
        //const contractABI = [...]; // Replace with your contract ABI
        //const contractABI = require('.build\contracts\PKIAuthold.json').abi;

        const contract = new web3.eth.Contract(contractABI, contractAddress);

        const publicKeyBytes = web3.utils.hexToBytes(privateKey); // Convert to bytes format

        try {
            await contract.methods
                .registerPublicKey(email, username, publicKeyBytes)
                .send({ from: ethAccount, gas: 200000 });

            alert("User registered on blockchain successfully!");
        } catch (error) {
            console.error("Error registering on blockchain:", error);
        }
    };

    return (
        <div className="container">
            <h2>Signup</h2>
            <p>Fill in the form below to create a new account and generate a key pair. Save the Private Key securely:</p>

            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            <input type="text" placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Country" onChange={(e) => setCountry(e.target.value)} />
            <input type="text" placeholder="City" onChange={(e) => setCity(e.target.value)} />

            <button onClick={generateEthereumAccount}>Generate Key Pair</button>

            {ethAccount && (
                <div>
                    <p><b>Ethereum Address:</b> {ethAccount}</p>
                    <p><b>Private Key (Save This!):</b> {privateKey}</p>
                </div>
            )}

            <button onClick={registerOnBlockchain}>Register</button>
        </div>
    );
};

export default Signup;
