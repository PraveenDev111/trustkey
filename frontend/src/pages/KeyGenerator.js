import React, { useState } from "react";
import { ethers } from "ethers";

const KeyGenerator = () => {
    const [publicKey, setPublicKey] = useState("");
    const [privateKey, setPrivateKey] = useState("");

    const generateKeys = () => {
        const wallet = ethers.Wallet.createRandom();
        setPublicKey(wallet.address);  // Ethereum address as public key
        setPrivateKey(wallet.privateKey);
    };

    const downloadKeys = () => {
        const content = `Public Key: ${publicKey}\nPrivate Key: ${privateKey}`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "key-pair.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <button onClick={generateKeys}>Generate Key Pair</button>
            {publicKey && (
                <div>
                    <p><strong>Public Key:</strong> {publicKey}</p>
                    <p><strong>Private Key:</strong> {privateKey}</p>
                    <button onClick={downloadKeys}>Download Key Pair</button>
                </div>
            )}
        </div>
    );
};

export default KeyGenerator;
