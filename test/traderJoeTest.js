const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const Ganache = require("./helpers/ganache");
const ERC20ABI = require("../externalAbi/ERC20.json");

// const TRADERJOEV2ROUTER02_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // TraderJoe V2: Router 2
const TRADERJOEV2ROUTER02_ADDRESS = "0x7b50046cec8252ca835b148b1edd997319120a12"; // Trader Joe Router LBRouter
// const USDT_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f"; // USDT Stablecoin
const USDT_ADDRESS = "0xab231a5744c8e6c45481754928ccffffd4aa0732"; // USDT Fuji
const WAVAX_ADDRESS = "0xd00ae08403b9bbb9124bb305c09058e32c39a48c"; // WAVAX_ADDRESS Fuji
const MAX_FEE_PERCENTAGE = 1000;

describe("Should succesfully swap AVAX to ERC20 token(USDT) using", async function () {
    const ganache = new Ganache();
    const bn = (input) => BigNumber.from(input);
    const assertBNequal = (bnOne, bnTwo) => assert.strictEqual(bnOne.toString(), bnTwo.toString());

    const adminRole = ethers.utils.id("ADMIN_ROLE");
    const ownerRole = ethers.utils.id("OWNER_ROLE");

    before("setup", async function () {
        [owner, main] = await ethers.getSigners();
        // Deploy USDT
        USDT = new ethers.Contract(USDT_ADDRESS, ERC20ABI, provider);
        // Deploy TraderJoeBaseProxy
        TraderJoeBaseProxy = await ethers.getContractFactory("TraderJoeBaseProxy").then((contract) => contract.deploy(TRADERJOEV2ROUTER02_ADDRESS));
        await TraderJoeBaseProxy.deployed();

        await ganache.snapshot();
    });

    afterEach("revert", function () {
        return ganache.revert();
    });

    const provider = ethers.provider;

    it.only("Swap AVAX to USDT", async function () {
        // Assert main has 1000 AVAX to start
        mainAddrBalance = await provider.getBalance(main.address);
        // Assert main USDT balance is 0
        assert(mainAddrBalance.eq(ethers.BigNumber.from(ethers.utils.parseEther("10000"))), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
        mainAddrUsdtBalance = await USDT.balanceOf(main.address);

        assert(mainAddrUsdtBalance.isZero(), "token balance is non zero, test requirement not ready to start");

        // Swap 1 AVAX for USDT
        await TraderJoeBaseProxy.connect(main).swapExactAVAXForTokens(0, [0], WAVAX_ADDRESS, USDT_ADDRESS, {
            value: ethers.utils.parseEther("1"),
        });

        // Assert mainAddrBalance contains one less AVAX
        expectedBalance = mainAddrBalance.sub(ethers.utils.parseEther("0.000001"));
        mainAddrBalance = await provider.getBalance(main.address);

        assert(mainAddrBalance.lt(expectedBalance), "AVAX not minused from admin AVAX balance");

        // Assert USDT balance increased
        mainAddrUsdtBalance = await USDT.balanceOf(main.address);
        assert(mainAddrUsdtBalance.gt(ethers.BigNumber.from("0")), "USDT balance on main address not increased, swap unsucsefull");
    });

    it.only("Should return fee value, base fee shoul equal 1% (100 units)", async function () {
        const fee = await TraderJoeBaseProxy.getFee();
        assert.equal(fee, `100`);
    });

    it.only("Should be possible to change fee", async function () {
        await TraderJoeBaseProxy.setFeeInPercentage(50);
        const fee = await TraderJoeBaseProxy.getFee();
        assert.equal(fee, `50`);
    });

    it.only(`Should return an error when trying to set up fee more than ${MAX_FEE_PERCENTAGE / 100}$`, async function () {
        await expect(TraderJoeBaseProxy.connect(main).setFeeInPercentage(2000)).to.be.revertedWith("The fee cannot be bigger than 10%");
        const fee = await TraderJoeBaseProxy.getFee();
        assert.equal(fee, `100`);
    });

    it.only(`Should be possible to withdrow AVAX from proxy contract`, async function () {
        await TraderJoeBaseProxy.connect(main).swapExactAVAXForTokens(0, [0], WAVAX_ADDRESS, USDT_ADDRESS, {
            value: ethers.utils.parseEther("1"),
        });

        assert(mainAddrUsdtBalance.gt(ethers.BigNumber.from("0")), "USDT balance on main address not increased, swap unsucsefull");
        const randomEmptyAddress = "0x0FEf957E583b0aCB499bC5946bCf997942b823CA";

        contractAddrAvaxBalanceBeforeSwap = await provider.getBalance(TraderJoeBaseProxy.address);
        ownerAddrAvaxBalanceBeforeSwap = await provider.getBalance(randomEmptyAddress);
        await TraderJoeBaseProxy.connect(main).withdrowAvaxFee(randomEmptyAddress);
        ownerAddrAvaxBalanceAfterSwap = await provider.getBalance(randomEmptyAddress);
        contractAddrAvaxBalanceAfterSwap = await provider.getBalance(TraderJoeBaseProxy.address);

        assert.equal(ownerAddrAvaxBalanceAfterSwap.toString(), contractAddrAvaxBalanceBeforeSwap.toString(), "withdrow unsuccsefull");
        assert.equal(ownerAddrAvaxBalanceBeforeSwap.toString(), contractAddrAvaxBalanceAfterSwap.toString(), "withdrow unsuccsefull");
    });
});
