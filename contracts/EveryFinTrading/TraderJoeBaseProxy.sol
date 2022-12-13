pragma solidity ^0.8.17;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ITraderJoe {
    /// @notice Swaps exact AVAX for tokens while performing safety checks
    /// @param _amountOutMin The min amount of token to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    /// @return amountOut Output amount of the swap
    function swapExactAVAXForTokens(
        uint256 _amountOutMin,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external payable returns (uint256 amountOut);
}

contract TraderJoeBaseProxy {
    using SafeERC20 for IERC20;
    uint256 public fee = 100;
    ITraderJoe traderJoe;
    IERC20 private IERC20Token;

    // Pass in address of TraderJoeV2Router02
    constructor(address _traderJoe) public {
        traderJoe = ITraderJoe(_traderJoe);
    }

    function swapExactAVAXForTokens(
        uint256 amountOutMin,
        uint256[] memory _pairBinSteps,
        IERC20 wavax,
        // address tokens,
        IERC20 token
    ) external payable {
        IERC20[] memory path = new IERC20[](2);
        path[0] = wavax;
        path[1] = token;
        uint256 sumMinusFee = msg.value - ((msg.value * fee) / 10000);
        traderJoe.swapExactAVAXForTokens{value: sumMinusFee}(amountOutMin, _pairBinSteps, path, tx.origin, block.timestamp);
        // change back to msg.sender!!
    }

    function getTokenProfit(IERC20 token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getProfit() public view returns (uint256) {
        return address(this).balance;
    }

    // 1% = 100 untis. fee can not be bigger than 10%
    function setFeeInPercentage(uint256 _newFee) public {
        require(_newFee <= 1000, "The fee cannot be bigger than 10%");
        fee = _newFee;
    }

    function getFee() public view returns (uint256) {
        return fee;
    }

    function withdrowTokenFee(
        IERC20 _tokenAddress,
        address _to,
        uint256 _value
    ) public {
        IERC20Token = _tokenAddress;
        IERC20Token.safeTransfer(_to, _value);
    }

    function withdrowAvaxFee(address payable _to) public {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        (bool sent, bytes memory data) = _to.call{value: address(this).balance}("");
        require(sent, "Failed to send Avax");
    }

    // Function to receive Avax. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    function getContractAvaxBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // function swapTokensForAVAX(
    //     address token,
    //     uint256 amountIn,
    //     uint256 amountOutMin
    // ) external returns (bool) {
    //     IERC20(token).transferFrom(msg.sender, address(this), amountIn);
    //     address[] memory path = new address[](2);
    //     path[0] = token;
    //     path[1] = uniswap.WETH();
    //     IERC20(token).approve(address(uniswap), amountIn);
    //     uniswap.swapExactTokensForAVAX(amountIn, amountOutMin, path, msg.sender, block.timestamp);
    // }
}

// amountIn - The amount of input tokens to send.
// amountOutMin - The minimum amount of output tokens that must be received for the transaction not to revert.
// по идее курс тенятся откуда-то (сказали что надо тянуть с оракла) и я должен считать amountOutMin в зависимости
// от подтянутого курса. Если я выставлю amountOutMin*90% , то слипедж будет 10 процентов. Так он и указывается.
