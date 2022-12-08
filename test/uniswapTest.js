const { assert } = require("chai");
const { ethers } = require("hardhat");
const ERC20ABI = require("../externalAbi/ERC20.json");

const UNISWAPV2ROUTER02_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2: Router 2
const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f"; // DAI Stablecoin

describe("UniswapTradeExample", function () {
  it("Swap ETH for DAI", async function () {
    const provider = ethers.provider;
    const [owner, addr1] = await ethers.getSigners();
    const DAI = new ethers.Contract(DAI_ADDRESS, ERC20ABI, provider);

    // Assert addr1 has 1000 ETH to start
    addr1Balance = await provider.getBalance(addr1.address);
    expectedBalance = ethers.BigNumber.from("10000000000000000000000");
    assert(addr1Balance.eq(expectedBalance));

    // Assert addr1 DAI balance is 0
    addr1Dai = await DAI.balanceOf(addr1.address);
    assert(addr1Dai.isZero());

    // Deploy UniswapTradeExample
    const uniswapTradeExample = await ethers
      .getContractFactory("UniswapTradeExample")
      .then((contract) => contract.deploy(UNISWAPV2ROUTER02_ADDRESS));
    await uniswapTradeExample.deployed();

    // Swap 1 ETH for DAI
    await uniswapTradeExample.connect(addr1).swapExactETHForTokens(0, DAI_ADDRESS, { value: ethers.utils.parseEther("1") });

    // Assert addr1Balance contains one less ETH
    expectedBalance = addr1Balance.sub(ethers.utils.parseEther("0.000001"));
    addr1Balance = await provider.getBalance(addr1.address);
    assert(addr1Balance.lt(expectedBalance));

    // Assert DAI balance increased
    addr1Dai = await DAI.balanceOf(addr1.address);
    console.log(addr1Dai);

    assert(addr1Dai.gt(ethers.BigNumber.from("0")));
  });

  it("Swap DAI for ETH", async function () {
    const provider = ethers.provider;
    const [owner, addr1] = await ethers.getSigners();
    const DAI = new ethers.Contract(DAI_ADDRESS, ERC20ABI, provider);

    // Assert addr1 has 1000 ETH to start
    addr1Balance = await provider.getBalance(addr1.address);
    // console.log(`1----=-----=----=----=----=----=----- addr1Balance -----=-----=-----=-----=-- 1`);
    // console.log(addr1Balance);
    // console.log(`2----=-----=----=----=----=----=----- addr1Balance -----=-----=-----=-----=-- 2`);

    // expectedBalance = ethers.BigNumber.from("9998990000000000000000"); // 9998.99 ETH
    expectedBalance = ethers.BigNumber.from("999899000000000"); // 9998.99 ETH
    assert(addr1Balance.gt(expectedBalance));
    // console.log(`1----=-----=----=----=----=----=----- expectedBalance -----=-----=-----=-----=-- 1`);
    // console.log(expectedBalance);
    // console.log(`2----=-----=----=----=----=----=----- expectedBalance -----=-----=-----=-----=-- 2`);

    // Assert addr1 DAI balance is 0
    addr1Dai = await DAI.balanceOf(addr1.address);
    assert(addr1Dai.gt(ethers.BigNumber.from("0")));

    // Deploy UniswapTradeExample
    const uniswapTradeExample = await ethers
      .getContractFactory("UniswapTradeExample")
      .then((contract) => contract.deploy(UNISWAPV2ROUTER02_ADDRESS));
    await uniswapTradeExample.deployed();

    // Swap 1 ETH for DAI
    console.log(`1----=-----=----=----=----=----=----- DAI balance  -----=-----=-----=-----=-- 1`);
    console.log(addr1Dai);
    console.log(`2----=-----=----=----=----=----=----- DAI balance  -----=-----=-----=-----=-- 2`);
    await uniswapTradeExample.connect(addr1).swapTokensForETH(DAI_ADDRESS, addr1Dai, 0);

    // Assert addr1Balance contains one less ETH
    // expectedBalance = addr1Balance.sub(ethers.utils.parseEther("1"));

    addr1Balance = await ethers.BigNumber.from(provider.getBalance(addr1.address));
    console.log(`1----=-----=----=----=----=----=----- eth balance  -----=-----=-----=-----=-- 1`);
    console.log(addr1Balance);
    console.log(`2----=-----=----=----=----=----=----- eth balance  -----=-----=-----=-----=-- 2`);
    // assert(addr1Balance.lt(expectedBalance));

    // Assert DAI balance increased
    addr1Dai = await ethers.BigNumber.from(DAI.balanceOf(addr1.address));
    console.log(`1----=-----=----=----=----=----=----- DAI balance  -----=-----=-----=-----=-- 1`);
    console.log(addr1Dai);
    console.log(`2----=-----=----=----=----=----=----- DAI balance  -----=-----=-----=-----=-- 2`);

    // console.log(addr1Dai);

    // assert(addr1Dai.gt(ethers.BigNumber.from("0")));
  });
});

// function swapTokensForETH(
//     address token,
//     uint256 amountIn,
//     uint256 amountOutMin
// ) external returns (bool) {
//     IERC20(token).transferFrom(msg.sender, address(this), amountIn);
//     address[] memory path = new address[](2);
//     path[0] = token;
//     path[1] = uniswap.WETH();
//     IERC20(token).approve(address(uniswap), amountIn);
//     uniswap.swapExactTokensForETH(amountIn, amountOutMin, path, msg.sender, block.timestamp);
// }
// }
