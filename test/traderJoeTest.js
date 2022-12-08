const { assert } = require("chai");
const { ethers } = require("hardhat");
const ERC20ABI = require("../externalAbi/ERC20.json");

// const TRADERJOEV2ROUTER02_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // TraderJoe V2: Router 2
const TRADERJOEV2ROUTER02_ADDRESS = "0x7b50046cec8252ca835b148b1edd997319120a12"; // Trader Joe Router LBRouter
// const USDT_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f"; // USDT Stablecoin
const USDT_ADDRESS = "0xab231a5744c8e6c45481754928ccffffd4aa0732"; // USDT Fuji
const WAVAX_ADDRESS = "0xd00ae08403b9bbb9124bb305c09058e32c39a48c"; // WAVAX_ADDRESS Fuji

describe("TraderJoeTradeExample", function () {
  it.only("Swap AVAX for USDT", async function () {
    const provider = ethers.provider;
    const [owner, addr1] = await ethers.getSigners();
    const USDT = new ethers.Contract(USDT_ADDRESS, ERC20ABI, provider);
    // console.log(`1----=-----=----=----=----=----=----- USDT -----=-----=-----=-----=-- 1`);
    // console.log(USDT);
    // console.log(`2----=-----=----=----=----=----=----- USDT -----=-----=-----=-----=-- 2`);

    // Assert addr1 has 1000 AVAX to start
    addr1Balance = await provider.getBalance(addr1.address);
    expectedBalance = ethers.BigNumber.from("10000000000000000000000");
    // assert(addr1Balance.eq(expectedBalance));
    // console.log(`1----=-----=----=----=----=----=----- addr1Balance -----=-----=-----=-----=-- 1`);
    // console.log(addr1Balance.eq(expectedBalance));
    // console.log(addr1Balance);
    // console.log(`2----=-----=----=----=----=----=-----  -----=-----=-----=-----=-- 2`);

    // Assert addr1 USDT balance is 0
    console.log(await USDT.name());
    addr1Usdt = await USDT.balanceOf(addr1.address);
    assert(addr1Usdt.isZero());
    // Deploy TraderJoeTradeExample
    const traderJoeTradeExample = await ethers
      .getContractFactory("TraderJoeTradeExample")
      .then((contract) => contract.deploy(TRADERJOEV2ROUTER02_ADDRESS));
    await traderJoeTradeExample.deployed();
    console.log(`======================= traderJoe deployed ===================`);

    // Swap 1 AVAX for USDT
    console.log(0, 0, {WAVAX_ADDRESS}, {USDT_ADDRESS}, { value: ethers.utils.parseEther("1") });
    await traderJoeTradeExample
      .connect(addr1)
      .swapExactAVAXForTokens(0, [0], WAVAX_ADDRESS, USDT_ADDRESS, { value: ethers.utils.parseEther("1") });
    // .swapExactAVAXForTokens(0, 0, WAVAX_ADDRESS, USDT_ADDRESS, { value: 10000000 });
    console.log(`======================= swapped ===================`);

    // Assert addr1Balance contains one less AVAX
    expectedBalance = addr1Balance.sub(ethers.utils.parseEther("0.000001"));
    addr1Balance = await provider.getBalance(addr1.address);
    assert(addr1Balance.lt(expectedBalance));

    // Assert USDT balance increased
    addr1Usdt = await USDT.balanceOf(addr1.address);
    console.log(addr1Usdt);

    assert(addr1Usdt.gt(ethers.BigNumber.from("0")));
  });

  // it("Swap USDT for AVAX", async function () {
  //   const provider = ethers.provider;
  //   const [owner, addr1] = await ethers.getSigners();
  //   const USDT = new ethers.Contract(USDT_ADDRESS, ERC20ABI, provider);

  //   // Assert addr1 has 1000 AVAX to start
  //   addr1Balance = await provider.getBalance(addr1.address);
  //   // console.log(`1----=-----=----=----=----=----=----- addr1Balance -----=-----=-----=-----=-- 1`);
  //   // console.log(addr1Balance);
  //   // console.log(`2----=-----=----=----=----=----=----- addr1Balance -----=-----=-----=-----=-- 2`);

  //   // expectedBalance = ethers.BigNumber.from("9998990000000000000000"); // 9998.99 AVAX
  //   expectedBalance = ethers.BigNumber.from("999899000000000"); // 9998.99 AVAX
  //   assert(addr1Balance.gt(expectedBalance));
  //   // console.log(`1----=-----=----=----=----=----=----- expectedBalance -----=-----=-----=-----=-- 1`);
  //   // console.log(expectedBalance);
  //   // console.log(`2----=-----=----=----=----=----=----- expectedBalance -----=-----=-----=-----=-- 2`);

  //   // Assert addr1 USDT balance is 0
  //   addr1Usdt = await USDT.balanceOf(addr1.address);
  //   assert(addr1Usdt.gt(ethers.BigNumber.from("0")));

  //   // Deploy TraderJoeTradeExample
  //   const traderJoeTradeExample = await ethers
  //     .getContractFactory("TraderJoeTradeExample")
  //     .then((contract) => contract.deploy(TRADERJOEV2ROUTER02_ADDRESS));
  //   await traderJoeTradeExample.deployed();

  //   // Swap 1 AVAX for USDT
  //   console.log(`1----=-----=----=----=----=----=----- USDT balance  -----=-----=-----=-----=-- 1`);
  //   console.log(addr1Usdt);
  //   console.log(`2----=-----=----=----=----=----=----- USDT balance  -----=-----=-----=-----=-- 2`);
  //   await traderJoeTradeExample.connect(addr1).swapTokensForAVAX(USDT_ADDRESS, addr1Usdt, 0);

  //   // Assert addr1Balance contains one less AVAX
  //   // expectedBalance = addr1Balance.sub(ethers.utils.parseEther("1"));

  //   addr1Balance = await ethers.BigNumber.from(provider.getBalance(addr1.address));
  //   console.log(`1----=-----=----=----=----=----=----- avax balance  -----=-----=-----=-----=-- 1`);
  //   console.log(addr1Balance);
  //   console.log(`2----=-----=----=----=----=----=----- avax balance  -----=-----=-----=-----=-- 2`);
  //   // assert(addr1Balance.lt(expectedBalance));

  //   // Assert USDT balance increased
  //   addr1Usdt = await ethers.BigNumber.from(USDT.balanceOf(addr1.address));
  //   console.log(`1----=-----=----=----=----=----=----- USDT balance  -----=-----=-----=-----=-- 1`);
  //   console.log(addr1Usdt);
  //   console.log(`2----=-----=----=----=----=----=----- USDT balance  -----=-----=-----=-----=-- 2`);

  //   // console.log(addr1Usdt);

  //   // assert(addr1Usdt.gt(ethers.BigNumber.from("0")));
  // });
});

// function swapTokensForAVAX(
//     address token,
//     uint256 amountIn,
//     uint256 amountOutMin
// ) external returns (bool) {
//     IERC20(token).transferFrom(msg.sender, address(this), amountIn);
//     address[] memory path = new address[](2);
//     path[0] = token;
//     path[1] = traderJoe.WAVAX();
//     IERC20(token).approve(address(traderJoe), amountIn);
//     traderJoe.swapExactTokensForAVAX(amountIn, amountOutMin, path, msg.sender, block.timestamp);
// }
// }
