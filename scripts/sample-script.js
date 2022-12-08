// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const { ethers, waffle } = require("hardhat");

const provider = waffle.provider;

async function main() {
  try {
    // const balance = await provider.getBalance("0x3A0060f7e429e6a8c217B8229d232E8Da506aa57");
    // console.log(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=`)
    // console.log(+balance/10**18)
    // console.log(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=`)
    const dataFromFile = fs.readFileSync("./scripts/addresses.json", {
      encoding: "utf-8",
    });
    const contracts = JSON.parse(dataFromFile);
    const accamulator = [];
    for await (element of contracts) {
      if ((!element.hasOwnProperty("address") || !element.address) && element.description) {
        const address = await startDeploy(element.description);
        accamulator.push({
          address,
          description: element.description,
        });
      } else accamulator.push(element);
      fs.writeFileSync("./scripts/addresses.json", `${JSON.stringify(accamulator)}`, { encoding: "utf-8" });
    }
  } catch (err) {
    console.error(err);
  }
}

async function startDeploy(description) {
  const addresses = await hre.ethers.getSigners();
  const admin = addresses[0];
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const link0001value = 1000000000000000; // 0.0001

  // Define the FluxAggregator arguments
  const LINK_TOKEN_ADDRESS = "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846";
  const paymentAmount = 10;
  const timeout = 172800;
  const validator = zeroAddress;
  const minSubmissionValue = 1;
  const maxSubmissionValue = 999999999999;
  const decimals = 8;
  // const description = "hello world!"
  console.log(`\nDeploying FluxAggregator contract to the blochain...`);
  const FluxAggregator = await hre.ethers.getContractFactory("FluxAggregator");
  const fluxAggregator = await FluxAggregator.deploy(
    LINK_TOKEN_ADDRESS,
    paymentAmount,
    timeout,
    validator,
    minSubmissionValue,
    maxSubmissionValue,
    decimals,
    description
  );

  await fluxAggregator.deployed();

  console.log("FluxAggregator successfully deployed to:", fluxAggregator.address);

  const LinkToken = await hre.ethers.getContractFactory("LinkToken");
  const linkToken = await LinkToken.attach(LINK_TOKEN_ADDRESS);
  const linkBalance = await linkToken.balanceOf(admin.address);
  console.log(`\nLINK token balance on sender address = ${+linkBalance / 10 ** 18}`);

  if (+linkBalance >= link0001value) {
    console.log(`Sending Link tokens to FluxAggrregator contract...`);

    const transferLink = await linkToken.transfer(fluxAggregator.address, link0001value);
    await transferLink.wait(); // wait a block
    console.log(`Tokens succesfully sended!`);

    const FluxAggregatorBalance = await linkToken.balanceOf(fluxAggregator.address);
    console.log(`LINK token balance on FluxAggregator contract = ${+FluxAggregatorBalance / 10 ** 18}`);
  } else {
    throw Error("Insuffficient link token balance on admin address!"); // move to start
  }
  console.log(`\nUpdateing available funds" on FluxAggregator contract...`);
  const UpdateAvailableFunds = await fluxAggregator.updateAvailableFunds({
    gasPrice: 30000000000,
    gasLimit: 6000000,
  });
  await UpdateAvailableFunds.wait(); // wait a block
  console.log("Available funds was successfully updated!");
  const availableFundsOnFluxAggregator = await fluxAggregator.availableFunds();
  console.log(`Available funds on FluxAggregator contract = ${availableFundsOnFluxAggregator / 10 ** 18} LINK tokens`);

  // set oracles to changeOracles function of FluxAggregator contract
  console.log(`\nAdding new chainlink node addresses to FluxAggregator contract...`);
  const removed = [];
  // const added = ["0xB121A4E4cdbe62c5868F28CB97726E6c2b512f27"]
  const added = ["0xD6fbB315572CE00e090e8b859b6F1D2577894D62"];
  const addedAdmins = ["0x3A0060f7e429e6a8c217B8229d232E8Da506aa57"];
  // const addedAdmins = [admin.address]
  const minSubmissions = 1;
  const maxSubmissions = 1;
  const restartDelay = 0;
  const changeOracles = await fluxAggregator.changeOracles(removed, added, addedAdmins, minSubmissions, maxSubmissions, restartDelay, {
    gasPrice: 30000000000,
    gasLimit: 6000000,
  });
  await changeOracles.wait(); // wait a block
  console.log("New chainlink nodes was successfully added to FluxAggregator contract!");

  console.log(`\nStarting a FluxAgregator contract verifying in the Block Explorer...`);
  console.log(`It usually takes 1-2 minutes`);

  await hre.run("verify:verify", {
    address: fluxAggregator.address,
    constructorArguments: [
      LINK_TOKEN_ADDRESS,
      paymentAmount,
      timeout,
      validator,
      minSubmissionValue,
      maxSubmissionValue,
      decimals,
      description,
    ],
  });
  console.log("\nFluxAggregator successfully verified on:", fluxAggregator.address);
  console.log("Done!");
  return fluxAggregator.address;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
