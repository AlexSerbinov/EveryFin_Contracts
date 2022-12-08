// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers, waffle } = require("hardhat");
// const wethArtifact = require("canonical-weth");
// const SAVAX_ABI = require("../contracts/serviceContracts/SAVAX_ABI.json");

const ERC20ABI = require("../externalAbi/ERC20.json"); // ERC20 abi for interacting with DAI
const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
const UNISWAPV2_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const provider = waffle.provider;

const main = async () => {
  const myMetamaskAddress = "0x3A0060f7e429e6a8c217B8229d232E8Da506aa57";
  const provider = ethers.provider;
  const [owner] = await ethers.getSigners();
  const DAI = new ethers.Contract(DAI_ADDRESS, ERC20ABI, provider);

  const compiledUniswapFactory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
  let uniswapFactory = await new ethers.ContractFactory(compiledUniswapFactory.interface, compiledUniswapFactory.bytecode, signer).deploy(
    await signer.getAddress()
  );

  const compiledWETH = require("canonical-weth/build/conrtacts/WETH.json");
  var WETH = await new ethers.ContractFactory(WETH.interface, WETH.bytecode, signer).deploy();

  ownerDaiBalance = await DAI.balanceOf(owner.address);
  console.log(ownerDaiBalance);
  console.log(`======================= label ===================`);

  // const admin = await hre.ethers.getSigner(myMetamaskAddress);

  // console.log(await provider.getCode(sAvaxProxyContractAddress)); // в мейнеті отримую данні, в форку пустота

  // const stakedAvax = new ethers.Contract(sAvaxProxyContractAddress, SAVAX_ABI, admin);
  // const sAvaxBalance = await stakedAvax.balanceOf(myMetamaskAddress);
  // console.log(`sAVAX balance= ${ethers.utils.formatEther(sAvaxBalance)}`); // в аваланч майнеті отримую, в форку не доходить сюди

  // await helpers.impersonateAccount(faucetAddress);
  // const impersonatedSigner = await ethers.getSigner(faucetAddress);

  // const helpers = require("@nomicfoundation/hardhat-network-helpers");
  //
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
