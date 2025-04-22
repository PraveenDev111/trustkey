// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/**
 * @title PKIAuth
 * @dev A smart contract for managing public key authentication.
 *      Users can register and verify their public keys to enable authentication.
 *     The user data along with Public key is stored here
 */

//truffle console //await web3.eth.getAccounts();

contract PKIAuth {
    struct User {
        bool exists;
        string username;
        string email;
        bytes[] publicKeys;
    }
    mapping(address => User) private users;
    address[] private userAddresses;

    //Events notify the applications about the change made to the contracts and applications which can be used to execute the dependent logic.
    event PublicKeyRegistered(
        address indexed user,
        string email,
        string username,
        bytes publicKey
    );
    event PublicKeyUpdated(address indexed user, bytes newPublicKey);
    event PublicKeyDeleted(address indexed user, string email, string username);

    /**
     * @dev Registers a public key for the sender.
     * @param email The email of the user.
     * @param username The username of the user.
     * @param publicKey The public key to register (must be a valid ECDSA public key).
     * Requirements:
     * - `email` cannot be empty.
     * - `username` cannot be empty.
     * - `publicKey` cannot be empty.
     */
    function registerPublicKey(
        string memory email,
        string memory username,
        bytes memory publicKey
    ) public {
        require(bytes(email).length > 0, "Email cannot be empty");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(publicKey.length > 0, "Public key cannot be empty");
        require(!users[msg.sender].exists, "User already registered");

        users[msg.sender] = User({
            exists: true,
            username: username,
            email: email,
            publicKeys: new bytes[](0)
        });
        users[msg.sender].publicKeys.push(publicKey);

        emit PublicKeyRegistered(msg.sender, email, username, publicKey);
    }
    // Update public key for an existing user
    function updatePublicKey(bytes memory newPublicKey) public {
        require(users[msg.sender].exists, "User not registered");
        require(newPublicKey.length > 0, "Invalid public key");

        users[msg.sender].publicKeys.push(newPublicKey);
        emit PublicKeyUpdated(msg.sender, newPublicKey);
    }
    // Retrieve user details
    function getUserDetails(
        address user
    ) public view returns (string memory, bytes[] memory) {
        require(users[user].exists, "User not found");
        return (users[user].username, users[user].publicKeys);
    }
    // Check if a user is registered
    function isUserRegistered(address user) public view returns (bool) {
        return users[user].exists;
    }
    //Function to delete a public key
    function deletePublicKey() external {
        require(users[msg.sender].exists, "User not registered");
        // Store user data before deletion
        string memory email = users[msg.sender].email;
        string memory username = users[msg.sender].username;

        emit PublicKeyDeleted(msg.sender, email, username);
        delete users[msg.sender]; // Removes user from mapping
    }

    function getAllUsers() public view returns (address[] memory) {
        return userAddresses; // Returns the list of user addresses
    }
}

contract PKIAuthold {
    // Mapping to store public keys by user address (this is a hash table)
    mapping(address => bytes) public publicKeys;

    // Event emitted when a public key is registered
    event PublicKeyRegistered(address indexed user, bytes publicKey);
    event PublicKeyUpdated(address indexed user, bytes newPublicKey);
    event PublicKeyDeleted(address indexed user);

    /**
     * @dev Registers a public key for the sender.
     * @param publicKey The public key to register (must be a valid ECDSA public key).
     * Requirements:
     * - `publicKey` cannot be empty.
     */
    function registerPublicKey(bytes memory publicKey) public {
        require(publicKey.length > 0, "Public key cannot be empty");
        require(
            publicKeys[msg.sender].length == 0,
            "Public key already registered"
        );

        publicKeys[msg.sender] = publicKey;

        emit PublicKeyRegistered(msg.sender, publicKey);
    }

    /**
     * @dev Checks if a user has registered a public key.
     * @param user The address of the user to verify.
     * @return True if the user has a registered public key, false otherwise.
     */
    function isPublicKeyRegistered(address user) public view returns (bool) {
        return publicKeys[user].length > 0;
    }

    //Function to update a public key
    function updatePublicKey(bytes memory _newPublicKey) external {
        require(_newPublicKey.length > 0, "Invalid public key");
        require(publicKeys[msg.sender].length > 0, "Public key not registered");

        publicKeys[msg.sender] = _newPublicKey;
        emit PublicKeyUpdated(msg.sender, _newPublicKey);
    }

    //Function to delete a public key
    function deletePublicKey() external {
        require(publicKeys[msg.sender].length > 0, "Public key not registered");
        delete publicKeys[msg.sender];
        emit PublicKeyDeleted(msg.sender);
    }
}
