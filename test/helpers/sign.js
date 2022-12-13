const { ethers } = require("hardhat");

const ERC1155Types = {
    SignData: [
        { name: "id", type: "uint256" },
        { name: "supply", type: "uint256" },
        { name: "fee", type: "uint128" },
        { name: "signTime", type: "uint128" },
        { name: "creator", type: "address" },
    ],
};
const ERC721Types = {
    SignData: [
        { name: "id", type: "uint256" },
        { name: "fee", type: "uint128" },
        { name: "signTime", type: "uint128" },
        { name: "creator", type: "address" },
    ],
};
const tradeType = {
    TradeData: [
        { name: "lotCreator", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "amount", type: "uint128" },
        { name: "endTime", type: "uint128" },
    ],
};
const auctionType = {
    AuctionData: [
        { name: "auctionCreator", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "startPrice", type: "uint256" },
        { name: "startTime", type: "uint128" },
        { name: "endTime", type: "uint128" },
        { name: "minDelta", type: "uint128" },
    ],
};
const cancelAuctionType = {
    CancelAuctionData: [
        { name: "bidder", type: "address" },
        { name: "auctionId", type: "uint256" },
    ],
};
const collectionType = {
    SignData: [
        { name: "creator", type: "address" },
        { name: "tokens", type: "uint256[]" },
        { name: "fee", type: "uint128" },
    ],
};
const ERC1155SignByUser = async (domain, id, supply, fee, signTime, creator, user) => ethers.utils.splitSignature(await user._signTypedData(domain, ERC1155Types, { id, supply, fee, signTime, creator }));

const ERC721SignByUser = async (domain, id, fee, signTime, creator, user) => ethers.utils.splitSignature(await user._signTypedData(domain, ERC721Types, { id, fee, signTime, creator }));

const signTradeDataByUser = async (domain, lotCreator, tokenId, price, amount, endTime, user) => ethers.utils.splitSignature(await user._signTypedData(domain, tradeType, { lotCreator, tokenId, price, amount, endTime }));

const signAuctionDataByUser = async (domain, auctionCreator, tokenId, amount, startPrice, startTime, endTime, minDelta, user) => ethers.utils.splitSignature(await user._signTypedData(domain, auctionType, { auctionCreator, tokenId, amount, startPrice, startTime, endTime, minDelta }));

const signCancelAuctionDataByUser = async (domain, bidder, auctionId, user) => ethers.utils.splitSignature(await user._signTypedData(domain, cancelAuctionType, { bidder, auctionId }));

const signCollcetionDataByUser = async (domain, creator, tokens, fee, user) => ethers.utils.splitSignature(await user._signTypedData(domain, collectionType, { creator, tokens, fee }));

module.exports = {
    ERC1155SignByUser,
    ERC721SignByUser,
    signTradeDataByUser,
    signAuctionDataByUser,
    signCancelAuctionDataByUser,
    signCollcetionDataByUser,
};
