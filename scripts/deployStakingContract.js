
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    await hre.run('compile');
    const addresses = await hre.ethers.getSigners();
    const admin = addresses[0];

    const PROXY_BENQIFI_STAKING_ADDRESS = "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE"; //benqi fi staking original contract, (proxy)

    // We get the contract to deploy
    StakingContract = await hre.ethers.getContractFactory("StakingContract");
    stakingContract = await StakingContract.deploy(PROXY_BENQIFI_STAKING_ADDRESS);
    await stakingContract.deployed();

    console.log("Benqi fi Base Proxy deployed to:", stakingContract.address);

    console.log(`\nStart verifying benqi.fi staking in the Block Explorer...`);
    console.log(`It usually takes 1-2 minutes`);

    await hre.run("verify:verify", {
        address: stakingContract.address,
        constructorArguments: [PROXY_BENQIFI_STAKING_ADDRESS],
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


