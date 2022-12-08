pragma solidity ^0.6.6;

// import "hardhat/console.sol";

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

    // function WETH() external pure returns (address);

    // function swapExactTokensForETH(
    //     uint256 amountIn,
    //     uint256 amountOutMin,
    //     address[] calldata path,
    //     address to,
    //     uint256 deadline=
    // ) external returns (uint256[] memory amounts);
}

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external;

    function approve(address spender, uint256 amount) external returns (bool);
}

contract TraderJoeTradeExample {
    ITraderJoe traderJoe;

    // Pass in address of UniswapV2Router02
    constructor(address _traderJoe) public {
        traderJoe = ITraderJoe(_traderJoe);
    }

    // (0, 0, WAVAX_ADDRESS, USDT_ADDRESS, { value: ethers.utils.parseEther("1") });
    function swapExactAVAXForTokens(
        uint256 amountOutMin,
        uint256[] memory _pairBinSteps,
        IERC20 wavax,
        // address tokens,
        IERC20 token
    ) external payable {
        IERC20[] memory path = new IERC20[](2);
        path[0] = wavax;
        // console.log(path[0]);
        path[1] = token;
        traderJoe.swapExactAVAXForTokens{value: msg.value}(amountOutMin, _pairBinSteps, path, msg.sender, block.timestamp);
    }

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
}
// amountIn - The amount of input tokens to send.
// amountOutMin - The minimum amount of output tokens that must be received for the transaction not to revert.
// по идее курс тенятся откуда-то (сказали что надо тянуть с оракла) и я должен считать amountOutMin в зависимости
// от подтянутого курса. Если я выставлю amountOutMin*90% , то слипедж будет 10 процентов. Так он и указывается.
