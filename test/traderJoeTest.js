const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const Ganache = require("./helpers/ganache");
const ERC20ABI = require("../externalAbi/Erc20Abi.json");
const { WAVAX } = require("@traderjoe-xyz/sdk");

const TRADERJOEV2ROUTER02_ADDRESS = "0xE3Ffc583dC176575eEA7FD9dF2A7c65F7E23f4C3"; // Trader Joe Router LBRouter mainnet
const USDT_ADDRESS = "0xde3A24028580884448a5397872046a019649b084"; // USDT mainnet
const USDT_E_ADDRESS = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"; // USDT bridged mainnet
const USDC_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; // USDC mainnet
const USDC_E_ADDRESS = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"; // USDC bridget mainnet
const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"; // WAVAX_ADDRESS mainnet
const randomEmptyAddress = "0x0FEf957E583b0aCB499bC5946bCf997942b823CA";
const FEE_VALUE = 100;
const MAX_FEE_PERCENTAGE = 1000;

describe("Trader Joe swap", async function () {
    const ganache = new Ganache();
    const fromBn = (input) => ethers.BigNumber.from(input);
    const assertBNequal = (bnOne, bnTwo, err) => assert.strictEqual(bnOne.toString(), bnTwo.toString(), `${err}`);
    const fromWei = (weiValue) => ethers.utils.formatEther(weiValue, { commify: true, pad: true });
    const toWei = (etherValue) => ethers.utils.parseEther(etherValue);
    const from8 = (units) => ethers.utils.formatUnits(units, 8);

    const adminRole = ethers.utils.id("DEFAULT_ADMIN_ROLE)");
    const ownerRole = ethers.utils.id("OWNER_ROLE");

    before("setup", async function () {
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

        // Deploy USDC contract
        USDC = new ethers.Contract(USDC_ADDRESS, ERC20ABI, provider);
        USDC_E = new ethers.Contract(USDC_E_ADDRESS, ERC20ABI, provider);
        USDT = new ethers.Contract(USDT_ADDRESS, ERC20ABI, provider);
        USDT_E = new ethers.Contract(USDT_E_ADDRESS, ERC20ABI, provider);
        // Deploy TradingContract
        TradingContract = await ethers.getContractFactory("TradingContract").then((contract) => contract.deploy(TRADERJOEV2ROUTER02_ADDRESS, WAVAX_ADDRESS));
        await TradingContract.deployed();

        var msgSender = await TradingContract.getMsgSender();
        console.log(`\nmsgSender     = ${msgSender}`);
        console.log(`owner address = ${owner.address}`);
        console.log(`admin address = ${admin.address}`);
        console.log(`user address  = ${user.address}`);
        console.log(`buyer address = ${buyer.address}`);
        console.log(`seller address = ${seller.address}`);
        console.log(`lastBlockTimestampPlus60Mins = ${timestampPlus60Mins}\n`);
        await ganache.snapshot();
    });

    afterEach("revert", async function () {
        // await ganache.revert();
    });

    const provider = ethers.provider;

    describe("Swap exect AVAX to ERC20 token (USDC) swapExactAVAXForTokens", async function () {
        it("Swap AVAX to USDC", async function () {
            // Assert buyer has 1000 AVAX to start
            AvaxBuyerBalanceBeforeSwap = await provider.getBalance(buyer.address);
            assert(AvaxBuyerBalanceBeforeSwap.eq(toWei("10000")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
            // Assert buyer has 0 USDC to start
            UsdcBuyerBalance = await USDC.balanceOf(buyer.address);
            assert(UsdcBuyerBalance.isZero(), "token balance is non zero, test requirement not ready to start");
            // Swap 1 AVAX for USDC
            const tokenPath = [WAVAX_ADDRESS, USDC_ADDRESS];
            await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                value: toWei("1"),
            });

            AvaxBuyerBalanceAfterSwap = await provider.getBalance(buyer.address);
            usdcBuyerBalanceAfterSwap = await USDC.balanceOf(buyer.address);
            // Assert AVAX balance decreased
            assert(AvaxBuyerBalanceAfterSwap.lt(AvaxBuyerBalanceBeforeSwap), "AVAX coins was not minused from buyer AVAX balance");
            // Assert USDC balance increased
            assert(usdcBuyerBalanceAfterSwap.gt(fromBn("0")), "USDC balance on buyer address not increased, swap unsucsefull");
            await ganache.revert();
        });
    });

    describe("Swap AVAX to Exact ERC20 token (USDC) swapAVAXForExactTokens", async function () {
        before(`Should be possible to set fee before swapTokensForExactTokens`, async function () {
            await TradingContract.connect(owner).setFeeInPercentage(FEE_VALUE);
            const fee = await TradingContract.getFee();
            assert.equal(fee, FEE_VALUE);
        });

        it("Swap AVAX to USDC", async function () {
            const path = [WAVAX_ADDRESS, USDC_ADDRESS];
            // Assert buyer has 1000 AVAX to start
            AvaxBuyerBalanceBeforeSwap = await provider.getBalance(buyer.address);
            assert(AvaxBuyerBalanceBeforeSwap.eq(toWei("10000")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
            // Assert buyer has 0 USDC to start
            UsdcBuyerBalance = await USDC.balanceOf(buyer.address);
            assert(UsdcBuyerBalance.isZero(), "token balance is non zero, test requirement not ready to start");
            // Swap 1 AVAX for USDC
            const avaxAmountToSend = 1000000000000;
            const realAvaxBalanceBefore = await TradingContract.getContractAvaxBalance();
            const avaxAmountToSendPlusFee = (avaxAmountToSend * avaxAmountToSend) / (avaxAmountToSend - 1 * (FEE_VALUE / 10000) * avaxAmountToSend);
            const trunkAvaxAmountToSendPlusFee = +Math.trunc(avaxAmountToSendPlusFee);

            // console.log("avaxAmountToSendPlusFee = ", avaxAmountToSendPlusFee);
            await TradingContract.connect(buyer).swapAVAXForExactTokens(10, [0], path, buyer.address, timestampPlus60Mins, {
                value: trunkAvaxAmountToSendPlusFee,
            });

            AvaxBuyerBalanceAfterSwap = await provider.getBalance(buyer.address);
            usdcBuyerBalanceAfterSwap = await USDC.balanceOf(buyer.address);
            // Assert AVAX balance decreased
            assert(AvaxBuyerBalanceAfterSwap.lt(AvaxBuyerBalanceBeforeSwap), "AVAX coins was not minused from buyer AVAX balance");
            // Assert USDC balance increased
            assert(usdcBuyerBalanceAfterSwap.gt(fromBn("0")), "USDC balance on buyer address not increased, swap unsucsefull");
            await ganache.revert();
        });
    });

    describe("Swap ERC20 token (USDC) for exact AVAX (swapTokensForExactAVAX)", async function () {
        it(`Should be possible to increase token allowance to proxy contract`, async function () {
            usdcAllowanceBeforeApprove = await USDC.allowance(buyer.address, TradingContract.address);

            await USDC.connect(buyer).approve(TradingContract.address, 10000000000);

            usdcAllowanceAfterApprove = await USDC.allowance(buyer.address, TradingContract.address);
            assert(usdcAllowanceBeforeApprove.lt(usdcAllowanceAfterApprove), "Approve was not increased");
        });

        it(`Should be possible to swap token to exact AVAX`, async function () {
            const usdcAmountToSwap = 74354;
            usdcBuyerBalance = await USDC.balanceOf(buyer.address);

            if (fromBn(usdcBuyerBalance) < usdcAmountToSwap) {
                avaxbuyerBalance = await provider.getBalance(buyer.address);
                assert(avaxbuyerBalance.gt(toWei("10")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
                const tokenPath = [WAVAX_ADDRESS, USDC_ADDRESS];
                await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [20], tokenPath, buyer.address, timestampPlus60Mins, {
                    value: toWei("1"),
                });
            }

            usdcBuyerBalanceBeforeSwap = await USDC.balanceOf(buyer.address);
            avaxSellerBalanceBeforeSwap = await provider.getBalance(seller.address);
            assert(usdcBuyerBalanceBeforeSwap.gt(usdcAmountToSwap), "USDC balance on buyer address not enougth for swap");

            const path = [USDC_ADDRESS, WAVAX_ADDRESS];

            await TradingContract.connect(buyer).swapTokensForExactAVAX(toWei("0.001"), usdcAmountToSwap, [0], path, seller.address, lastBlockTimestamp + 3600);

            usdcBuyerBalanceAfterSwap = await USDC.balanceOf(buyer.address);
            AvaxSellerBalanceAfterSwap = await provider.getBalance(seller.address);

            assert(usdcBuyerBalanceAfterSwap.lt(usdcBuyerBalanceBeforeSwap), "USDC balance on buyer address not decreased, swap unsuccessful");
            assertBNequal(avaxSellerBalanceBeforeSwap.add(toWei("0.001")), AvaxSellerBalanceAfterSwap, "AVAX balance on seller address not increased, swap unsuccessful");
        });
    });

    describe("Swap exact ERC20 token (USDC) for AVAX (swapExactTokensForAVAX)", async function () {
        it(`Should be possible to increase token allowance to proxy contract`, async function () {
            usdcAllowanceBeforeApprove = await USDC.allowance(buyer.address, TradingContract.address);

            await USDC.connect(buyer).approve(TradingContract.address, 10000000000);

            usdcAllowanceAfterApprove = await USDC.allowance(buyer.address, TradingContract.address);
            assert(usdcAllowanceBeforeApprove.lt(usdcAllowanceAfterApprove), "Allowance was not increased");
        });

        it(`Should be possible to swap exact token to AVAX`, async function () {
            const usdcAmountToSwap = 5000000;
            usdcBuyerBalance = await USDC.balanceOf(buyer.address);

            // If USDC balance not enough for swap. Swap first AVAX to USDC
            if (fromBn(usdcBuyerBalance) < usdcAmountToSwap) {
                avaxbuyerBalance = await provider.getBalance(buyer.address);
                assert(avaxbuyerBalance.gt(toWei("10")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
                // Swap 10 AVAX for USDC
                const tokenPath = [WAVAX_ADDRESS, USDC_ADDRESS];
                await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                    value: toWei("1"),
                });
            }

            usdcBuyerBalanceBeforeSwap = await USDC.balanceOf(buyer.address);
            avaxBuyerBalanceBeforeSwap = await provider.getBalance(buyer.address);
            // Assert to have enough USDC to swap
            assert(usdcBuyerBalanceBeforeSwap.gt(usdcAmountToSwap), "USDC balance on buyer address not increased, swap unsucsefull");
            // Key operation
            //_amountIn, _amountOutMinAVAX, _pairBinSteps, _tokenPath, payable(_to), _deadline
            const tokenPath = [USDC_ADDRESS, WAVAX_ADDRESS];
            await TradingContract.connect(buyer).swapExactTokensForAVAX(usdcAmountToSwap, toWei("0.005"), [0], tokenPath, buyer.address, lastBlockTimestamp + 3600);

            // make sure you have enogh USDC balance for swap
            usdcBuyerBalanceAfterSwap = await USDC.balanceOf(buyer.address);
            AvaxBuyerBalanceAfterSwap = await provider.getBalance(buyer.address);
            // Assert USDC balance equal exact usdcBuyerBalanceBeforeSwap - usdcAmountToSwap
            assert(usdcBuyerBalanceAfterSwap.eq(usdcBuyerBalanceBeforeSwap - usdcAmountToSwap), "USDC balance on buyer address not decreased, swap unsucsefull");
            // // Assert AVAX balance increased
            assert(AvaxBuyerBalanceAfterSwap.gt(avaxBuyerBalanceBeforeSwap), "AVAX balance on buyer address not increased, swap unsucsefull");
            // console.log(`slippage = ${(100 - (usdt_eBuyerBalanceAfterSwap - usdt_eBuyerBalanceBeforeSwap) / 100).toFixed(2)}%`);
        });
    });

    describe("Swap exact ERC20 token (USDC.e) to other ERC20 token(USDT.e) (swapExactTokensForTokens)", async function () {
        it(`Should be possible to increase token allowance to proxy contract`, async function () {
            usdc_eAllowanceBeforeApprove = await USDC_E.allowance(buyer.address, TradingContract.address);
            await USDC_E.connect(buyer).approve(TradingContract.address, 10000000000);
            usdc_eAllowanceAfterApprove = await USDC_E.allowance(buyer.address, TradingContract.address);
            assert(usdc_eAllowanceBeforeApprove.lt(usdc_eAllowanceAfterApprove), "Allowance was not increased");
        });

        it(`Should be possible to swap exact (USDC.e) token to (USDT.e)token`, async function () {
            const path = [USDC_E_ADDRESS, USDC_ADDRESS, USDT_E_ADDRESS];
            // const usdc_eAmountToSwap = 100000; // если оставить такую сумму и фии 150, то слипедж віходит -884.79%, разобраться почему так
            const usdc_eAmountToSwap = 10000; // если оставить такую сумму и фии 150, то слипедж віходит -884.79%, разобраться почему так
            usdc_eBuyerBalance = await USDC_E.balanceOf(buyer.address);

            // If USDC_E balance not enough for swap. Swap first USDT_E to USDC_E
            if (fromBn(usdc_eBuyerBalance) < usdc_eAmountToSwap) {
                avaxbuyerBalance = await provider.getBalance(buyer.address);
                assert(avaxbuyerBalance.gt(toWei("10")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
                // Swap 10 AVAX for USDC_E
                const tokenPath = [WAVAX_ADDRESS, USDC_E_ADDRESS];
                await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                    value: toWei("1"),
                });
            }
            usdc_eBuyerBalanceBeforeSwap = await USDC_E.balanceOf(buyer.address);
            usdt_eBuyerBalanceBeforeSwap = await USDT_E.balanceOf(buyer.address);
            // Assert to have enough USDC_E to swap
            assert(usdc_eBuyerBalanceBeforeSwap.gt(usdc_eAmountToSwap), "USDC_E balance on buyer address not increased, swap unsucsefull");
            // Key operation

            await TradingContract.connect(buyer).swapExactTokensForTokens(usdc_eAmountToSwap, 0, [1, 1], path, buyer.address, lastBlockTimestamp + 3600);
            // 9980 means 2% slippage
            // make sure you have enogh USDC_E balance for swap
            usdc_eBuyerBalanceAfterSwap = await USDC_E.balanceOf(buyer.address);

            usdt_eBuyerBalanceAfterSwap = await USDT_E.balanceOf(buyer.address);

            tokenReward = await TradingContract.connect(owner).getContractTokenBalance(USDC_E.address); // // this is to test about charging token fee
            assert(usdc_eBuyerBalanceAfterSwap.lt(usdc_eBuyerBalanceBeforeSwap), "USDC_E balance on buyer address not decreased, swap unsucsefull");
            // Assert USDT_E balance increased
            assert(usdt_eBuyerBalanceAfterSwap.gt(usdt_eBuyerBalanceBeforeSwap), "USDT_E balance on buyer address not increased, swap unsucsefull");
        });

        // write test to slipage
    });

    describe("Swap ERC20 token (USDC.e) to exact other ERC20 token(USDT.e) (swapTokensForExactTokens)", async function () {
        it(`Should be possible to increase token allowance to proxy contract`, async function () {
            usdc_eAllowanceBeforeApprove = await USDC_E.allowance(buyer.address, TradingContract.address);
            await USDC_E.connect(buyer).approve(TradingContract.address, 10000000000);
            usdc_eAllowanceAfterApprove = await USDC_E.allowance(buyer.address, TradingContract.address);
            assert(usdc_eAllowanceBeforeApprove.lt(usdc_eAllowanceAfterApprove), "Allowance was not increased");
        });

        it(`Should be possible to set fee before swapTokensForExactTokens`, async function () {
            await TradingContract.connect(owner).setFeeInPercentage(FEE_VALUE);
            const fee = await TradingContract.getFee();
            assert.equal(fee, FEE_VALUE);
        });

        it(`Should be possible to swap exact (USDC.e) token to (USDT.e)token and charge a token fee form token swap `, async function () {
            const path = [USDC_E_ADDRESS, USDC_ADDRESS, USDT_E_ADDRESS];
            const usdt_eAmountToRecieve = 80000; //
            const usdc_eAmountToSend = 100000;

            // Little bit math
            // x - FEE_VALUE%(x) = usdc_eAmountToSend
            // finding the (x)
            const usdc_eAmountToSendPlusFee = (usdc_eAmountToSend * usdc_eAmountToSend) / (usdc_eAmountToSend - 1 * (FEE_VALUE / 10000) * usdc_eAmountToSend);
            const trunkUsdc_eAmountToSendPlusFee = +Math.trunc(usdc_eAmountToSendPlusFee);
            const expectedProfit = trunkUsdc_eAmountToSendPlusFee - usdc_eAmountToSend;

            usdc_eBuyerBalance = await USDC_E.balanceOf(buyer.address);

            // If USDC_E balance not enough for swap. Swap first USDT_E to USDC_E
            if (fromBn(usdc_eBuyerBalance) < usdt_eAmountToRecieve) {
                avaxbuyerBalance = await provider.getBalance(buyer.address);
                assert(avaxbuyerBalance.gt(toWei("10")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
                // Swap 10 AVAX for USDC_E
                const tokenPath = [WAVAX_ADDRESS, USDC_E_ADDRESS];
                await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                    value: toWei("1"),
                });
            }
            const usdc_ebalanceOnProxyContractBeforeSwap = await TradingContract.connect(buyer).getContractTokenBalance(USDC_E_ADDRESS);
            usdc_eBuyerBalanceBeforeSwap = await USDC_E.balanceOf(buyer.address);
            usdt_eBuyerBalanceBeforeSwap = await USDT_E.balanceOf(buyer.address);

            // Assert to have enough USDC_E to swap
            assert(usdc_eBuyerBalanceBeforeSwap.gt(usdt_eAmountToRecieve), "USDC_E balance on buyer address not increased, swap unsucsefull");

            await TradingContract.connect(buyer).swapTokensForExactTokens(usdt_eAmountToRecieve, trunkUsdc_eAmountToSendPlusFee, [1, 1], path, buyer.address, lastBlockTimestamp + 3600);

            // make sure you have enogh USDC_E balance for swap
            usdc_eBuyerBalanceAfterSwap = await USDC_E.balanceOf(buyer.address);

            usdt_eBuyerBalanceAfterSwap = await USDT_E.balanceOf(buyer.address);
            const usdc_ebalanceOnProxyContractAfterSwap = await TradingContract.connect(buyer).getContractTokenBalance(USDC_E_ADDRESS);

            // Assert USDC_E balance decreased
            // Assert USDT_E balance increased
            assert(usdc_eBuyerBalanceAfterSwap.lt(usdc_eBuyerBalanceBeforeSwap), "USDC_E balance on buyer address not decreased, swap unsucsefull");
            assert(usdt_eBuyerBalanceAfterSwap.gt(usdt_eBuyerBalanceBeforeSwap), "USDT_E balance on buyer address not increased, swap unsucsefull");
            // assert TradingContract not transered more balance than required
            assert.equal(usdt_eBuyerBalanceAfterSwap - usdt_eBuyerBalanceBeforeSwap, usdt_eAmountToRecieve, "Recieve not exact amount than expecped");
            assert.equal(usdc_ebalanceOnProxyContractAfterSwap - usdc_ebalanceOnProxyContractBeforeSwap, expectedProfit, "profit on TradingContract not to equal expected profit");
        });

        // write test to slipage
    });

    describe("Withdraw operations", async function () {
        it(`Should be possible to withdrow AVAX from proxy contract`, async function () {
            const tokenPath = [WAVAX_ADDRESS, USDC_ADDRESS];
            await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                value: toWei("1"),
            });
            usdcBuyerBalanceAfterSwap = await USDC.balanceOf(buyer.address);
            assert(usdcBuyerBalanceAfterSwap.gt(fromBn("0")), "USDC balance on buyer address not increased, swap unsucsefull");

            contractAvaxBalanceBeforeSwap = await provider.getBalance(TradingContract.address);
            ownerAvaxBalanceBeforeSwap = await provider.getBalance(randomEmptyAddress);
            await TradingContract.connect(owner).withdrawAvaxFee(randomEmptyAddress);
            ownerAvaxBalanceAfterSwap = await provider.getBalance(randomEmptyAddress);
            contractAvaxBalanceAfterSwap = await provider.getBalance(TradingContract.address);

            assert.equal(ownerAvaxBalanceAfterSwap.toString(), contractAvaxBalanceBeforeSwap.toString(), "withdrow unsuccsefull");
            assert.equal(ownerAvaxBalanceBeforeSwap.toString(), contractAvaxBalanceAfterSwap.toString(), "withdrow unsuccsefull");
            await ganache.revert();
        });

        it("Should not be possible to withdrow AVAX from proxy contract if user is not an admin", async function () {
            await expect(TradingContract.connect(admin).withdrawAvaxFee(randomEmptyAddress)).to.be.revertedWith("Must have admin role to set fee");
            await ganache.revert();
        });

        it(`Should be possible to withdraw token fee from proxy contract`, async function () {
            const tokenPath = [WAVAX_ADDRESS, USDC_ADDRESS];

            await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                value: toWei("1"),
            });

            usdcBuyerBalanceAfterSwap = await USDC.balanceOf(buyer.address);
            await USDC.connect(buyer).transfer(TradingContract.address, usdcBuyerBalanceAfterSwap);

            usdcContractBalanceBeforeWithdraw = await USDC.balanceOf(TradingContract.address);
            usdcUserBalanceBeforeSwap = await USDC.balanceOf(user.address);
            await TradingContract.connect(owner).withdrawTokenFee(USDC_ADDRESS, user.address);
            usdcContractBalanceAfterSwap = await USDC.balanceOf(TradingContract.address);
            usdcUserBalanceAfterSwap = await USDC.balanceOf(user.address);

            assert(usdcContractBalanceBeforeWithdraw.gt(fromBn("0")), "USDC balance on buyer address not increased, swap unsucsefull");
            assert.equal(usdcUserBalanceAfterSwap.toString(), usdcContractBalanceBeforeWithdraw.toString(), "withdraw unsuccsefull");
            assert.equal(usdcUserBalanceBeforeSwap.toString(), usdcContractBalanceAfterSwap.toString(), "withdraw unsuccsefull");
            await ganache.revert();
        });
    });

    describe("Fee functionality", async function () {
        it("Should return fee value, base fee shoul equal 1% (100 units)", async function () {
            const fee = await TradingContract.getFee();
            assert.equal(fee, `100`);
            await ganache.revert();
        });

        it("Should be possible to change fee if user is an admin", async function () {
            await TradingContract.connect(owner).setFeeInPercentage(50);
            const fee = await TradingContract.getFee();
            assert.equal(fee, `50`);
            await ganache.revert();
        });

        it("Should not be possible to change fee if user is not an admin", async function () {
            await expect(TradingContract.connect(admin).setFeeInPercentage(50)).to.be.revertedWith("Must have admin role to set fee");
            const fee = await TradingContract.getFee();
            //
            assert.equal(fee, `100`);
            await ganache.revert();
            await ganache.revert();
        });

        it(`Should return an error when trying to set up fee more than ${MAX_FEE_PERCENTAGE / 100}$`, async function () {
            await expect(TradingContract.connect(owner).setFeeInPercentage(2000)).to.be.revertedWith("The fee cannot be bigger than 10%");
            const fee = await TradingContract.getFee();
            assert.equal(fee, `100`);
            await ganache.revert();
        });
    });

    describe("Pause functionality", async function () {
        it(`contract should be not paused by defaut`, async function () {
            const paused = await TradingContract.connect(owner).paused();
            assert.equal(paused, false, "Contract should be not paused by default");
        });

        it(`Swap should be succesfull swap when contarct not paused`, async function () {
            avaxbuyerBalance = await provider.getBalance(buyer.address);
            assert(avaxbuyerBalance.gt(toWei("10")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");
            const tokenPath = [WAVAX_ADDRESS, USDC_E_ADDRESS];
            await TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                value: toWei("1"),
            });
            avaxbuyerBalanceAfterSwap = await provider.getBalance(buyer.address);
            assert(avaxbuyerBalanceAfterSwap.lt(avaxbuyerBalance), "AVAX swap unsucsefull, when contract not paused");
        });

        it(`Owner should can pause contract`, async function () {
            const hasRole = await TradingContract.connect(owner).hasRole(ownerRole, owner.address);
            assert.equal(hasRole, true, "Owner must have OWNER_ROLE to pause contract");
            paused = await TradingContract.connect(owner).paused();
            assert.equal(paused, false, "Contract should be not paused by default");
            await TradingContract.connect(owner).pause();
            paused = await TradingContract.connect(owner).paused();
            assert.equal(paused, true, "Contract should be not paused by default");
        });
        it(`Swap should not be succesfull when contarct is paused`, async function () {
            avaxbuyerBalance = await provider.getBalance(buyer.address);
            assert(avaxbuyerBalance.gt(toWei("10")), "start AVAX balance should equal 1000 AVAX, test requirement not ready to start ");

            const tokenPath = [WAVAX_ADDRESS, USDC_E_ADDRESS];
            await expect(
                TradingContract.connect(buyer).swapExactAVAXForTokens(0, [0], tokenPath, buyer.address, timestampPlus60Mins, {
                    value: toWei("1"),
                })
            ).to.be.revertedWith("Token swap is not allowed while the contract is on pause");

            avaxbuyerBalanceAfterSwap = await provider.getBalance(buyer.address);
        });
        // not working without previous test
        it(`Owner should unpause contract`, async function () {
            const hasRole = await TradingContract.connect(owner).hasRole(ownerRole, owner.address);
            assert.equal(hasRole, true, "Owner must have OWNER_ROLE to pause contract");
            paused = await TradingContract.connect(owner).paused();
            assert.equal(paused, true, "Contract should be not paused by default");
            await TradingContract.connect(owner).unpause();
            paused = await TradingContract.connect(owner).paused();
            assert.equal(paused, false, "Contract should be not paused by default");
        });

        it(`Not owner can't pause contract`, async function () {
            const hasRole = await TradingContract.connect(owner).hasRole(ownerRole, buyer.address);
            assert.equal(hasRole, false, "Buyer must not have OWNER_ROLE");
            await expect(TradingContract.connect(buyer).pause()).to.be.revertedWith("Must have owner role to pause");
        });

        it(`Pause contract shoud be succesfull`, async function () {
            const hasRole = await TradingContract.connect(owner).hasRole(ownerRole, buyer.address);
            assert.equal(hasRole, false, "Buyer must not have OWNER_ROLE");
            await expect(TradingContract.connect(buyer).unpause()).to.be.revertedWith("Must have owner role to unpause");
        });
    });
});
