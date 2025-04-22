const PKIAuth = artifacts.require("PKIAuth");

module.exports = function (deployer) {
    deployer.deploy(PKIAuth);
};
