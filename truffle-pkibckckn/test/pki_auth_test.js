const PKIAuth = artifacts.require("PKIAuth");

contract("PKIAuth", async (accounts) => {
    let pkiAuthInstance;

    before(async () => {
        pkiAuthInstance = await PKIAuth.deployed();
    });

    it("should register 3 users with public keys", async () => {
        // Register user 1
        await pkiAuthInstance.registerPublicKey("user1@email.com", "user1", web3.utils.hexToBytes("0xabcdef1234567890"), { from: accounts[0] });

        // Register user 2
        await pkiAuthInstance.registerPublicKey("user2@email.com", "user2", web3.utils.hexToBytes("0x1234567890abcdef"), { from: accounts[1] });

        // Register user 3
        await pkiAuthInstance.registerPublicKey("user3@email.com", "user3", web3.utils.hexToBytes("0x7890abcdef123456"), { from: accounts[2] });

        let user1Exists = await pkiAuthInstance.isUserRegistered(accounts[0]);
        let user2Exists = await pkiAuthInstance.isUserRegistered(accounts[1]);
        let user3Exists = await pkiAuthInstance.isUserRegistered(accounts[2]);

        console.log("User 1 Registered:", user1Exists);
        console.log("User 2 Registered:", user2Exists);
        console.log("User 3 Registered:", user3Exists);
    });

    it("should update public key for user 1", async () => {
        await pkiAuthInstance.updatePublicKey(web3.utils.hexToBytes("0x7890abcdec123455"), { from: accounts[0] });

        let userDetails = await pkiAuthInstance.getUserDetails(accounts[0]);
        console.log("Updated Public Keys for User 1:", userDetails[1]); // Print all public keys
    });

    it("should delete user 2", async () => {
        await pkiAuthInstance.deletePublicKey({ from: accounts[1] });

        let user2Exists = await pkiAuthInstance.isUserRegistered(accounts[1]);
        console.log("User 2 Registered after deletion:", user2Exists);
    });

    it("should display all available users", async () => {
        for (let i = 0; i < accounts.length; i++) {
            let isRegistered = await pkiAuthInstance.isUserRegistered(accounts[i]);

            if (isRegistered) {
                let userDetails = await pkiAuthInstance.getUserDetails(accounts[i]);
                let username = userDetails[0];
                let publicKeys = userDetails[1]; // Public keys array

                console.log(`✅ Account ${i} (${accounts[i]}) is registered.`);
                console.log(`   Username: ${username}`);
                console.log(`   Public Keys: ${publicKeys.map(pk => web3.utils.bytesToHex(pk))}`);
            } else {
                console.log(`❌ Account ${i} (${accounts[i]}) is not registered.`);
            }
        }
    });
    //NEXT TEST CASES CREATE AN ACCOUNT UPON REGISTRATION. WITH SOME AS. WHICH MEANS, WHEN USER CREATION TAKES PLACE, A PARALLEL ACCOUNT IS CREATED ON GANACHE
    //
});

/*
contract("PKIAuth", (accounts) => {
    let pkiAuthInstance;

    //sample user details
    const email = "test@example.com";
    const username = "testuser";
    const publicKey1 = web3.utils.hexToBytes("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    const publicKey2 = web3.utils.hexToBytes("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    before(async () => {
        pkiAuthInstance = await PKIAuth.deployed();
        //console.log("PKIAuth contract deployed at:", pkiAuthInstance.address);
    });

    // Test Case 1: Register a New User
    it("Should register a new user with a public key", async () => {
        try {
            let tx = await pkiAuthInstance.registerPublicKey(email, username, publicKey1, { from: accounts[0] });
            console.log("Public Key Registered:", tx.logs[0].args.publicKey);

            let isRegistered = await pkiAuthInstance.isUserRegistered(accounts[0]);
            console.log("User Registered Status:", isRegistered);

            let userDetails = await pkiAuthInstance.getUserDetails(accounts[0]);
            console.log("Username:", userDetails[0]);
            console.log("Public Keys:", userDetails[1]);
            //assert.equal(web3.utils.toHex(userDetails[1]), web3.utils.toHex(publicKey1), "Incorrect public key");

        } catch (error) {
            console.error("Test failed:", error); // Print full error object
        }
    });

    // Test Case 2: Register an Already Registered User
    it("Should not allow duplicate registration", async () => {
        try {
            await pkiAuthInstance.registerPublicKey(email, username, publicKey1, { from: accounts[0] });
            console.error("Test failed: User registered twice!");
        } catch (error) {
            console.log("Expected error:", error.reason); // Should print "User already registered"
        }
    });

    // Test Case 3: Register with Empty Email or Username
    it("Should not allow empty email or username", async () => {
        try {
            await pkiAuthInstance.registerPublicKey("", username, publicKey1, { from: accounts[1] });
            console.error("Test failed: Allowed empty email");
        } catch (error) {
            console.log("Expected error (email):", error.reason);
        }

        try {
            await pkiAuthInstance.registerPublicKey(email, "", publicKey1, { from: accounts[2] });
            console.error("Test failed: Allowed empty username");
        } catch (error) {
            console.log("Expected error (username):", error.reason);
        }
    });
    // Test Case 4: Update Public Key
    it("Should update the public key", async () => {
        try {
            let tx = await pkiAuthInstance.UpdatePublicKey(publicKey2, { from: accounts[0] });
            console.log("Public Key Updated:", tx.logs[0].args.newPublicKey);

            let userDetails = await pkiAuthInstance.getUserDetails(accounts[0]);
            console.log("Updated Public Keys:", userDetails[1]);

        } catch (error) {
            console.error("Test failed:", error.reason);
        }
    });
    // Test Case 5: Update Public Key Without Registering
    it("Should not update public key if user is not registered", async () => {
        try {
            await pkiAuthInstance.UpdatePublicKey(publicKey1, { from: accounts[3] });
            console.error("Test failed: Unregistered user updated public key!");
        } catch (error) {
            console.log("Expected error:", error.reason);
        }
    });

    // Test Case 6: Retrieve User Details
    it("Should retrieve user details", async () => {
        try {
            let userDetails = await pkiAuthInstance.getUserDetails(accounts[0]);
            console.log("Username:", userDetails[0]);
            console.log("Public Keys:", userDetails[1]);

        } catch (error) {
            console.error("Test failed:", error.reason);
        }
    });

    // Test Case 7: Retrieve Details of Unregistered User
    it("Should not retrieve details of an unregistered user", async () => {
        try {
            await pkiAuthInstance.getUserDetails(accounts[4]);
            console.error("Test failed: Retrieved details of unregistered user!");
        } catch (error) {
            console.log("Expected error:", error.reason);
        }
    });

    // Test Case 8: Delete User
    it("Should delete a user", async () => {
        try {
            let tx = await pkiAuthInstance.deletePublicKey({ from: accounts[0] });
            console.log("User deleted:", tx.logs[0].args.username);

            let isRegistered = await pkiAuthInstance.isUserRegistered(accounts[0]);
            console.log("User Registered Status After Deletion:", isRegistered);
        } catch (error) {
            console.error("Test failed:", error.reason);
        }
    });

    // Test Case 9: Delete Unregistered User
    it("Should not delete an unregistered user", async () => {
        try {
            await pkiAuthInstance.deletePublicKey({ from: accounts[5] });
            console.error("Test failed: Deleted an unregistered user!");
        } catch (error) {
            console.log("Expected error:", error.reason);
        }
    });
});



contract("PKIAuth", (accounts) => {
    let pkiAuth;
    const publicKey1 = "0x0a9Bd3D16304263A9ac3c300bD61d7d9d9B3f0cE";
    const publicKey2 = "0x04208d75c4d2551338957a7155645d34e18e24656464f9f2516a05937d5c92e965b4204409943093f5426f7a478b49c6897b06a9064b2448d3765225f0786f";

    beforeEach(async () => {
        pkiAuth = await PKIAuth.new();
    });

    it("should register a valid public key", async () => {
        const tx = await pkiAuth.registerPublicKey(publicKey2, { from: accounts[0] });
        assert.equal(tx.logs[0].event, "PublicKeyRegistered", "Event should be emitted");
        assert.equal(tx.logs[0].args.user, accounts[0], "Incorrect user address");
        assert.equal(
            web3.utils.toHex(tx.logs[0].args.publicKey),
            web3.utils.toHex(publicKey2),
            "Incorrect public key"
        );

    });

    it("should verify a registered public key", async () => {
        await pkiAuth.registerPublicKey(web3.utils.toHex(publicKey1), { from: accounts[0] });
        const isRegistered = await pkiAuth.isPublicKeyRegistered(accounts[0]);
        assert.isTrue(isRegistered, "Public key should be registered");
    });

    it("should reject empty public keys", async () => {
        try {
            await pkiAuth.registerPublicKey("0x", { from: accounts[0] });
            assert.fail("Should have thrown an error"); // This line won't be reached
        } catch (error) {
            // Check for the specific reason given in your contract's revert message:
            assert.include(error.message, "Public key cannot be empty", "Error message should contain 'Public key cannot be empty'");
        }
    });

    it("should reject registration of the same public key twice", async () => {
        await pkiAuth.registerPublicKey(web3.utils.toHex(publicKey1), { from: accounts[0] });
        try {
            await pkiAuth.registerPublicKey(web3.utils.toHex(publicKey1), { from: accounts[0] });
            assert.fail("Should have thrown an error"); // This line won't be reached
        } catch (error) {
            assert.include(error.message, "Public key already registered", "Error message should contain 'Public key already registered'");
        }
    });

    it("should handle unregistered users correctly", async () => {
        const isRegistered = await pkiAuth.isPublicKeyRegistered(accounts[1]);
        assert.isFalse(isRegistered, "Public key should not be registered");
    });

    it("should update a public key", async () => {
        const tx = await pkiAuth.registerPublicKey(web3.utils.toHex(publicKey1), { from: accounts[0] });
        console.log(web3.utils.toHex(tx.logs[0].args.publicKey));
        tk = await pkiAuth.updatePublicKey(web3.utils.toHex(publicKey2), { from: accounts[0] });
        console.log(web3.utils.toHex(tk.logs[0].args.publicKey));
        const isRegistered = await pkiAuth.isPublicKeyRegistered(accounts[0]);
        assert.isTrue(isRegistered, "Public key should be registered");
    });

    it("should delete a public key", async () => {
        await pkiAuth.registerPublicKey(web3.utils.toHex(publicKey1), { from: accounts[0] });
        await pkiAuth.deletePublicKey({ from: accounts[0] });
        const isRegistered = await pkiAuth.isPublicKeyRegistered(accounts[0]);
        assert.isFalse(isRegistered, "Public key should not be registered");
    });
});

const PKIAuth = artifacts.require("PKIAuth");

contract("PKIAuth", (accounts) => {
    it("should register a public key", async () => {
        const instance = await PKIAuth.deployed();
        const publicKey = "0x12345678";

        console.log("Original Public Key: ", publicKey);

        // Register the public key
        await instance.registerPublicKey(publicKey, { from: accounts[0] });

        // Retrieve the registered public key
        const registeredKey = await instance.publicKeys(accounts[0]);

        console.log("Retrieved Public Key: ", registeredKey);

        // Assert that the registered key matches the original
        assert.equal(registeredKey, publicKey, "Public key should match");
    });

    it("should verify public key registration", async () => {
        const instance = await PKIAuth.deployed();

        const isRegistered = await instance.isPublicKeyRegistered(accounts[0]);
        assert.isTrue(isRegistered, "Public key should be registered");
    });

    it("should reject empty public key", async () => {
        const instance = await PKIAuth.deployed();

        try {
            await instance.registerPublicKey("0x", { from: accounts[1] });
            assert.fail("Empty public key was accepted");
        } catch (error) {
            assert.include(error.message, "Public key cannot be empty", "asserted error not thrown");
        }
    });

    it("should not verify registration for an unregistered user", async () => {
        const instance = await PKIAuth.deployed();

        const isRegistered = await instance.isPublicKeyRegistered(accounts[2]);
        assert.isFalse(isRegistered, "Unregistered user should not have a public key");
    });
});

*/

