const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const Ganache = require("./helpers/ganache");
const ERC20ABI = require("../externalAbi/Erc20Abi.json");
const SAVAX_ABI = require("../externalAbi/SavaxAbi.json");
const { WAVAX } = require("@traderjoe-xyz/sdk");

const BENQIFI_STAKING_ADDRESS = "0x0CE7F620Eb645a4FbF688a1C1937bC6CB0CbDd29"; //benqi fi staking original contract, (no proxy)
const PROXY_BENQIFI_STAKING_ADDRESS = "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE"; //benqi fi staking original contract, (proxy)
const USDC_E_ADDRESS = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"; // USDC bridget mainnet
const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"; // WAVAX_ADDRESS mainnet
const randomEmptyAddress = "0x0FEf957E583b0aCB499bC5946bCf997942b823CA";
const FEE_VALUE = 100;
const MAX_FEE_PERCENTAGE = 1000;

describe("Benqi.Fe staking", async () => {
    const ganache = new Ganache();
    const fromBn = (input) => ethers.BigNumber.from(input);
    const assertBNequal = (bnOne, bnTwo, err) => assert.strictEqual(bnOne.toString(), bnTwo.toString(), `${err}`);
    const fromWei = (weiValue) => ethers.utils.formatEther(weiValue, { commify: true, pad: true });
    const toWei = (etherValue) => ethers.utils.parseEther(etherValue);
    const from8 = (units) => ethers.utils.formatUnits(units, 8);

    const adminRole = ethers.utils.id("DEFAULT_ADMIN_ROLE)");
    const ownerRole = ethers.utils.id("OWNER_ROLE");

    before("setup", async () => {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        admin = accounts[1];
        user = accounts[2];
        buyer = accounts[3];
        seller = accounts[4]; 
        buyer2 = accounts[5];
        operator = accounts[6];

        // declare block.timestamp
        blockNumBefore = await ethers.provider.getBlockNumber();
        blockBefore = await ethers.provider.getBlock(blockNumBefore);
        lastBlockTimestamp = blockBefore.timestamp;
        timestampPlus60Mins = lastBlockTimestamp + 3600; // Note: timestamp for past fixed block

        // // Connect to sAVAX contract
        SAVAX = new ethers.Contract(PROXY_BENQIFI_STAKING_ADDRESS, SAVAX_ABI, provider);

        // Deploy StakingContract
        StakingContract = await ethers.getContractFactory("StakingContract").then((contract) => contract.deploy(PROXY_BENQIFI_STAKING_ADDRESS));
        await StakingContract.deployed();
        console.log("Benqi Base Proxy deployed to:", StakingContract.address);

        var msgSender = await StakingContract.getMsgSender();
        console.log(`\nmsgSender     = ${msgSender}`);
        console.log(`owner address = ${owner.address}`);
        console.log(`admin address = ${admin.address}`);
        console.log(`user address  = ${user.address}`);
        console.log(`buyer address = ${buyer.address}`);
        console.log(`seller address = ${seller.address}`);
        console.log(`lastBlockTimestampPlus60Mins = ${timestampPlus60Mins}\n`);
        await ganache.snapshot();
    });

    afterEach("revert", async () => {
        // await ganache.revert();
    });

    const provider = ethers.provider;

    describe("Stake (submit) functionality", async () => {
        let initialBuyerBalance, initialContractBalance, initialOwnerAvaxBalance, finalBuyerBalance, finalContractBalance, finalOwnerAvaxBalance, contractAvaxBalanceAfterSubmit;
        const submitAmount = toWei("1");

        it("Should fetch initial balances", async () => {
            initialContractBalance = await SAVAX.balanceOf(StakingContract.address);
            initialBuyerBalance = await SAVAX.balanceOf(owner.address);
            initialOwnerAvaxBalance = await ethers.provider.getBalance(owner.address);
        });

        it("Should reject submit if contract is paused", async () => {
            // move to pause section
            await StakingContract.pause();
            await expect(StakingContract.connect(owner).submit({ value: submitAmount })).to.be.revertedWith("Token swap is not allowed while the contract is on pause");
            await StakingContract.unpause();
        });

        it("Should be possible to submit some avax on proxy and reduce the owner's avax balance by the exact submit amount", async () => {
            initialOwnerAvaxBalance = await ethers.provider.getBalance(owner.address);
            const tx = await StakingContract.connect(owner).submit({ value: submitAmount });
            const txReceipt = await tx.wait();

            const txCost = txReceipt.gasUsed.mul(tx.gasPrice);
            finalOwnerAvaxBalance = await ethers.provider.getBalance(owner.address);
            contractAvaxBalanceAfterSubmit = await ethers.provider.getBalance(StakingContract.address);
            assert(initialOwnerAvaxBalance.sub(finalOwnerAvaxBalance).eq(submitAmount.add(txCost)), "Owner's AVAX balance did not decrease by the exact submit amount after submit");
        });

        it("Should have transferred savax to the owner", async () => {
            finalBuyerBalance = await SAVAX.balanceOf(owner.address);
            assert(finalBuyerBalance.gt(initialBuyerBalance), "Buyer's savax balance did not increase after submit");
        });

        it("Should keep 1% fee in the contract", async () => {
            initialOwnerAvaxBalance = await ethers.provider.getBalance(StakingContract.address);
            const tx = await StakingContract.connect(owner).submit({ value: submitAmount });
            finalContractAvaxBalance = await ethers.provider.getBalance(StakingContract.address);
            const expectedAvaxFee = submitAmount.div(100); // 1% of the submitted amount
            assert(finalContractAvaxBalance.eq(initialOwnerAvaxBalance.add(expectedAvaxFee)), "Contract's avax balance did not increase correctly after submit");
        });

        it("Should reject submit if contract is paused again", async () => {
            // move to pause section
            await StakingContract.pause();
            await expect(StakingContract.connect(owner).submit({ value: submitAmount })).to.be.revertedWith("Token swap is not allowed while the contract is on pause");
            await StakingContract.unpause();
        });
    });

    describe("Fee functionality", async () => {
        it("Should return fee value, base fee shoul equal 1% (100 units)", async () => {
            const fee = await StakingContract.getFee();
            assert.equal(fee, `100`);
            await ganache.revert();
        });

        it("Should be possible to change fee if user is an admin", async () => {
            await StakingContract.connect(owner).setFeeInPercentage(50);
            const fee = await StakingContract.getFee();
            assert.equal(fee, `50`);
            await ganache.revert();
        });

        it("Should not be possible to change fee if user is not an admin", async () => {
            await expect(StakingContract.connect(admin).setFeeInPercentage(50)).to.be.revertedWith("Must have admin role to set fee");
            const fee = await StakingContract.getFee();
            //
            assert.equal(fee, `100`);
            await ganache.revert();
            await ganache.revert();
        });

        it(`Should return an error when trying to set up fee more than ${MAX_FEE_PERCENTAGE / 100}$`, async () => {
            await expect(StakingContract.connect(owner).setFeeInPercentage(2000)).to.be.revertedWith("The fee cannot be bigger than 10%");
            const fee = await StakingContract.getFee();
            assert.equal(fee, `100`);
            await ganache.revert();
        });
    });

    describe("Pause functionality", async () => {
        it(`contract should be not paused by defaut`, async () => {
            const paused = await StakingContract.connect(owner).paused();
            assert.equal(paused, false, "Contract should be not paused by default");
        });


        it(`Owner should can pause contract`, async () => {
            const hasRole = await StakingContract.connect(owner).hasRole(ownerRole, owner.address);
            assert.equal(hasRole, true, "Owner must have OWNER_ROLE to pause contract");
            paused = await StakingContract.connect(owner).paused();
            assert.equal(paused, false, "Contract should be not paused by default");
            await StakingContract.connect(owner).pause();
            paused = await StakingContract.connect(owner).paused();
            assert.equal(paused, true, "Contract should be not paused by default");
        });
        it(`Owner should unpause contract`, async () => {
            const hasRole = await StakingContract.connect(owner).hasRole(ownerRole, owner.address);
            assert.equal(hasRole, true, "Owner must have OWNER_ROLE to pause contract");
            paused = await StakingContract.connect(owner).paused();
            assert.equal(paused, true, "Contract should be not paused by default");
            await StakingContract.connect(owner).unpause();
            paused = await StakingContract.connect(owner).paused();
            assert.equal(paused, false, "Contract should be not paused by default");
        });

        it(`Not owner can't pause contract`, async () => {
            const hasRole = await StakingContract.connect(owner).hasRole(ownerRole, buyer.address);
            assert.equal(hasRole, false, "Buyer must not have OWNER_ROLE");
            await expect(StakingContract.connect(buyer).pause()).to.be.revertedWith("Must have owner role to pause");
        });

        it(`Pause contract shoud be succesfull`, async () => {
            const hasRole = await StakingContract.connect(owner).hasRole(ownerRole, buyer.address);
            assert.equal(hasRole, false, "Buyer must not have OWNER_ROLE");
            await expect(StakingContract.connect(buyer).unpause()).to.be.revertedWith("Must have owner role to unpause");
        });
    });
});
