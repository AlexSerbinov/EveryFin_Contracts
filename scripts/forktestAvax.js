// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers, waffle } = require("hardhat");
const SAVAX_ABI = require("../contracts/serviceContracts/SAVAX_ABI.json");

const provider = waffle.provider;

const main = async () => {
  const myMetamaskAddress = "0x3A0060f7e429e6a8c217B8229d232E8Da506aa57";
  const sAvaxProxyContractAddress = "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE";
  const admin = await hre.ethers.getSigner(myMetamaskAddress);
  
  console.log(await provider.getCode(sAvaxProxyContractAddress)); // в мейнеті отримую данні, в форку пустота

  const stakedAvax = new ethers.Contract(sAvaxProxyContractAddress, SAVAX_ABI, admin);
  const sAvaxBalance = await stakedAvax.balanceOf(myMetamaskAddress);
  console.log(`sAVAX balance= ${ethers.utils.formatEther(sAvaxBalance)}`); // в аваланч майнеті отримую, в форку не доходить сюди 






  // await helpers.impersonateAccount(faucetAddress);
  // const impersonatedSigner = await ethers.getSigne
  
  const helpers = require("@nomicfoundation/hardhat-network-helpers");
  r(faucetAddress);
  // const balance = await provider.getBalance("0x3A0060f7e429e6a8c217B8229d232E8Da506aa57");
  // const faucetAddressBalance = await provider.getBalance("0x2352D20fC81225c8ECD8f6FaA1B37F24FEd450c9");

  // const tx = {
  //   to: "0x3A0060f7e429e6a8c217B8229d232E8Da506aa57",
  //   value: ethers.utils.parseEther("2", "ether"),
  // };
  // const transaction = await impersonatedSigner.sendTransaction(tx);
  // await transaction.wait(); // wait a block
  // const faucetAddressBalanceAfter = await provider.getBalance("0x2352D20fC81225c8ECD8f6FaA1B37F24FEd450c9");
  // console.log(admin.address);

  // const StakedAvax = await hre.ethers.getContractFactory("StakedAvax");
  // const stakedAvax = await StakedAvax.attach(sAvaxProxy);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
