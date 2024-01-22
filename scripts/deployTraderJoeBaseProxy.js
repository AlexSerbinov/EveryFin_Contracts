// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {

    const addresses = await hre.ethers.getSigners();
    const admin = addresses[0];

    const TRADERJOEV2ROUTER02_ADDRESS = "0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3"; //  Mainnet Trader Joe Router LBRouter
    const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"; // WAVAX_ADDRESS mainnet

    // We get the contract to deploy
    TradingContract = await hre.ethers.getContractFactory("TradingContract");
    tradingContract = await TradingContract.deploy(TRADERJOEV2ROUTER02_ADDRESS, WAVAX_ADDRESS);
    await tradingContract.deployed();

    console.log("Trader Joe Base Proxy deployed to:", TradingContract.address);

    console.log(`\nStart verifying TradingContract in the Block Explorer...`);
    console.log(`It usually takes 1-2 minutes`);

    await hre.run("verify:verify", {
        address: tradingContract.address,
        constructorArguments: [TRADERJOEV2ROUTER02_ADDRESS, WAVAX_ADDRESS],
    });
    console.log("Done!");
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

