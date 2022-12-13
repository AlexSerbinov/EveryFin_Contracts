const getEventArgs = async (transaction) => {
    // console.log((await transaction.wait()).events[0]);
    return (await transaction.wait()).events[0].args;
};

const ERC721HashData = (creator, id, supply) => {
    return ethers.utils.solidityKeccak256(["address", "uint256"], [creator, id]);
};

const ERC1155HashData = (creator, id, supply) => {
    return ethers.utils.solidityKeccak256(["address", "uint256", "uint256"], [creator, id, supply]);
};

const bn = (input) => BigNumber.from(input);
const assertBNequal = (bnOne, bnTwo) => assert.strictEqual(bnOne.toString(), bnTwo.toString());

module.exports = {
    getEventArgs,
    ERC721HashData,
    ERC1155HashData,
    bn,
    assertBNequal,
};
