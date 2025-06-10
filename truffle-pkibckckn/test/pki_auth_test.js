const UserAuth = artifacts.require("UserAuth");

contract("UserAuth", async (accounts) => {
    let userAuthInstance;

    before(async () => {
        userAuthInstance = await UserAuth.deployed();
    });

    it("should register 3 users with public keys", async () => {
        // Register user 1
        await userAuthInstance.registerPublicKey("user1@email.com", "user1", web3.utils.hexToBytes("0xabcdef1234567890"), { from: accounts[0] });

        // Register user 2
        await userAuthInstance.registerPublicKey("user2@email.com", "user2", web3.utils.hexToBytes("0x1234567890abcdef"), { from: accounts[1] });

        // Register user 3
        await userAuthInstance.registerPublicKey("user3@email.com", "user3", web3.utils.hexToBytes("0x7890abcdef123456"), { from: accounts[2] });

        let user1Exists = await userAuthInstance.isUserRegistered(accounts[0]);
        let user2Exists = await userAuthInstance.isUserRegistered(accounts[1]);
        let user3Exists = await userAuthInstance.isUserRegistered(accounts[2]);

        console.log("User 1 Registered:", user1Exists);
        console.log("User 2 Registered:", user2Exists);
        console.log("User 3 Registered:", user3Exists);
    });

    it("should update public key for user 1", async () => {
        await userAuthInstance.updatePublicKey(web3.utils.hexToBytes("0x7890abcdec123455"), { from: accounts[0] });

        let userDetails = await userAuthInstance.getUserDetails(accounts[0]);
        console.log("Updated Public Keys for User 1:", userDetails[1]); // Print all public keys
    });

    it("should delete user 2", async () => {
        await userAuthInstance.deletePublicKey({ from: accounts[1] });

        let user2Exists = await userAuthInstance.isUserRegistered(accounts[1]);
        console.log("User 2 Registered after deletion:", user2Exists);
    });

    it("should display all available users", async () => {
        for (let i = 0; i < accounts.length; i++) {
            let isRegistered = await userAuthInstance.isUserRegistered(accounts[i]);
    
            if (isRegistered) {
                const userDetails = await userAuthInstance.getUserDetails(accounts[i]);
                const username = userDetails[0];
                const email = userDetails[1];
                const publicKeys = userDetails[2];
    
                console.log(`✅ Account ${i} (${accounts[i]}) is registered.`);
                console.log(`   Username: ${username}`);
                console.log(`   Email: ${email}`);
                console.log(`   Public Keys: ${publicKeys.map(pk => web3.utils.bytesToHex(pk))}`);
            } else {
                console.log(`❌ Account ${i} (${accounts[i]}) is not registered.`);
            }
        }
    });
    //Insert user details to ganache account on cli.
    // NEXT TEST CASES CREATE AN ACCOUNT UPON REGISTRATION. WITH SOME AS. WHICH MEANS, WHEN USER CREATION TAKES PLACE, A PARALLEL ACCOUNT IS CREATED ON GANACHE
    //
});
