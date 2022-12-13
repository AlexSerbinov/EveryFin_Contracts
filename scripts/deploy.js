// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');
    const TRADERJOEV2ROUTER02_ADDRESS = "0x7b50046cec8252ca835b148b1edd997319120a12"; // Trader Joe Router LBRouter

    // We get the contract to deploy
    TraderJoeBaseProxy = await ethers.getContractFactory("TraderJoeBaseProxy").then((contract) => contract.deploy(TRADERJOEV2ROUTER02_ADDRESS));
    await TraderJoeBaseProxy.deployed();

    console.log("Trader Joe Base Proxy deployed to:", TraderJoeBaseProxy.address);

    console.log(`\nStart verifying TraderJoeBaseProxy in the Block Explorer...`);
    console.log(`It usually takes 1-2 minutes`);

    await hre.run("verify:verify", {
        address: TraderJoeBaseProxy.address,
        constructorArguments: [TRADERJOEV2ROUTER02_ADDRESS],
    });
    // console.log("\nFluxAggregator successfully verified on:", fluxAggregator.address);
    console.log("Done!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
