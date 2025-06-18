// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserCertificateManager {
    // User Management
    struct User {
        bool exists;
        string username;
        string email;
        bytes publicKey;  // Keep the original public key for backward compatibility
    }

    // Certificate Management
    struct PublicKey {
        string keyData;
        bool isActive;
        uint256 addedAt;
    }

    struct Certificate {
        string serialNumber;
        string country;
        string state;
        string locality;
        string organization;
        string commonName;
        string publicKey;
        string signatureAlgorithm;
        uint256 validFrom;
        uint256 validTo;
        bool isRevoked;
    }

    // Mappings
    mapping(address => User) public users;
    mapping(bytes => address) public publicKeyToAddress;
    mapping(address => Certificate) public userCertificates;
    mapping(address => PublicKey[]) public userPublicKeys;
    mapping(address => uint256) public activeKeyIndex;
    address[] private registeredUsers;

    // Events
    event UserRegistered(address indexed user, string email, string username);
    event PublicKeyUpdated(address indexed user, string keyData);
    event CertificateIssued(address indexed user, string serialNumber);
    event PublicKeyAdded(address indexed user, string keyData);
    event PublicKeyDeactivated(address indexed user, uint256 keyIndex);
    event CertificateRevoked(address indexed user, string reason);

    // User Registration
    function registerUser(
        string memory email, 
        string memory username, 
        bytes memory publicKey
    ) public {
        require(bytes(email).length > 0, "Email cannot be empty");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(publicKey.length > 0, "Public key cannot be empty");
        require(!users[msg.sender].exists, "User already registered");
        require(publicKeyToAddress[publicKey] == address(0), "Public key already registered");

        users[msg.sender] = User({
            exists: true,
            username: username,
            email: email,
            publicKey: publicKey
        });

        publicKeyToAddress[publicKey] = msg.sender;
        registeredUsers.push(msg.sender);

        // Add the public key to the keys array
        userPublicKeys[msg.sender].push(PublicKey({
            keyData: string(publicKey),
            isActive: true,
            addedAt: block.timestamp
        }));
        activeKeyIndex[msg.sender] = 0;

        emit UserRegistered(msg.sender, email, username);
    }

    // Certificate Management
    function issueCertificate(
        string memory _serialNumber,
        string memory _country,
        string memory _state,
        string memory _locality,
        string memory _organization,
        string memory _commonName,
        string memory _publicKey,
        string memory _signatureAlgorithm,
        uint256 _validDays
    ) external {
        require(users[msg.sender].exists, "User not registered");
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");
        require(_validDays > 0, "Validity period must be positive");
        require(bytes(userCertificates[msg.sender].serialNumber).length == 0, "Certificate already exists");

        uint256 validFrom = block.timestamp;
        uint256 validTo = validFrom + (_validDays * 1 days);

        userCertificates[msg.sender] = Certificate({
            serialNumber: _serialNumber,
            country: _country,
            state: _state,
            locality: _locality,
            organization: _organization,
            commonName: _commonName,
            publicKey: _publicKey,
            signatureAlgorithm: _signatureAlgorithm,
            validFrom: validFrom,
            validTo: validTo,
            isRevoked: false
        });

        emit CertificateIssued(msg.sender, _serialNumber);
    }

    // Public Key Management
    function addPublicKey(string memory _keyData) public {
        require(users[msg.sender].exists, "User not registered");
        require(bytes(_keyData).length > 0, "Public key cannot be empty");
        
        // Add new public key
        userPublicKeys[msg.sender].push(PublicKey({
            keyData: _keyData,
            isActive: true,
            addedAt: block.timestamp
        }));

        // Set the new key as active
        uint256 newKeyIndex = userPublicKeys[msg.sender].length - 1;
        activeKeyIndex[msg.sender] = newKeyIndex;

        emit PublicKeyAdded(msg.sender, _keyData);
    }

    function deactivatePublicKey(uint256 _keyIndex) external {
        require(users[msg.sender].exists, "User not registered");
        require(_keyIndex < userPublicKeys[msg.sender].length, "Invalid key index");
        require(userPublicKeys[msg.sender][_keyIndex].isActive, "Key already inactive");
        require(userPublicKeys[msg.sender].length > 1, "Cannot deactivate the only key");
        
        userPublicKeys[msg.sender][_keyIndex].isActive = false;
        
        if (activeKeyIndex[msg.sender] == _keyIndex) {
            for (uint256 i = 0; i < userPublicKeys[msg.sender].length; i++) {
                if (i != _keyIndex && userPublicKeys[msg.sender][i].isActive) {
                    activeKeyIndex[msg.sender] = i;
                    break;
                }
            }
        }

        emit PublicKeyDeactivated(msg.sender, _keyIndex);
    }

    function revokeCertificate(string memory _reason) external {
        require(users[msg.sender].exists, "User not registered");
        require(bytes(userCertificates[msg.sender].serialNumber).length != 0, "No certificate found");
        require(!userCertificates[msg.sender].isRevoked, "Certificate already revoked");
        
        userCertificates[msg.sender].isRevoked = true;
        
        // Deactivate all public keys
        for (uint256 i = 0; i < userPublicKeys[msg.sender].length; i++) {
            userPublicKeys[msg.sender][i].isActive = false;
        }
        
        emit CertificateRevoked(msg.sender, _reason);
    }

    // View Functions
    function getActivePublicKey(address _user) external view returns (string memory) {
        require(users[_user].exists, "User not registered");
        uint256 activeIndex = activeKeyIndex[_user];
        require(userPublicKeys[_user].length > 0, "No public keys found");
        require(userPublicKeys[_user][activeIndex].isActive, "No active public key");
        
        return userPublicKeys[_user][activeIndex].keyData;
    }

    function getUserPublicKeys(address _user) external view returns (PublicKey[] memory) {
        require(users[_user].exists, "User not registered");
        return userPublicKeys[_user];
    }

    function getCertificateInfo(address _user) external view returns (
        string memory serialNumber,
        string memory commonName,
        string memory organization,
        uint256 validFrom,
        uint256 validTo,
        bool isRevoked
    ) {
        require(users[_user].exists, "User not registered");
        Certificate memory cert = userCertificates[_user];
        return (
            cert.serialNumber,
            cert.commonName,
            cert.organization,
            cert.validFrom,
            cert.validTo,
            cert.isRevoked
        );
    }

    function generateChallenge(address user) public view returns (bytes memory challenge) {
        require(users[user].exists, "User not registered");
        
        // Generate random number for challenge
        uint256 random = uint256(keccak256(
            abi.encodePacked(
                block.timestamp,
                block.difficulty,
                user
            )
        ));
        
        return abi.encodePacked(random);
    }

    function verifySignature(
        bytes32 messageHash,
        bytes memory signature,
        address signer
    ) public view returns (bool) {
        require(users[signer].exists, "Signer not registered");
        
        // This is a simplified version - in production, you'd want to implement proper ECDSA recovery
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        address recovered = recoverSigner(ethSignedMessageHash, signature);
        return recovered == signer;
    }
    
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) 
        internal pure returns (address) 
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }
    
    function splitSignature(bytes memory sig)
        internal pure returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        
        if (v < 27) v += 27;
    }
}
