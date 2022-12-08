// pragma solidity ^0.8.0;

// interface IUniswap {
//     function swapExactTokensForETH(
//         uint256 amountIn,
//         uint256 amountOutMin,
//         address[] calldata path,
//         address to,
//         uint256 deadline
//     ) external returns (uint256[] memory amounts);

//     function WETH() external pure returns (address);
// }

// interface IERC20 {
//     function transferFrom(
//         address sender,
//         address recipient,
//         uint256 amount
//     ) external;

//     function approve(address spender, uint256 amount) external returns (bool);
// }

// contract MyDefiProject {
//     IUniswap uniswap;

//     constructor(address _uniswap) {
//         uniswap = IUniswap(_uniswap);
//     }

//     function swapTokensForETH(
//         address token,
//         uint256 amountIn,
//         uint256 amountOutMin
//         // uint256 deadline
//     ) external returns (bool) {
//         IERC20(token).transferFrom(msg.sender, address(this), amountIn);
//         address[] memory path = new address[](2);
//         path[0] = token;
//         path[1] = uniswap.WETH();
//         IERC20(token).approve(address(uniswap), amountIn);
//         uniswap.swapExactTokensForETH(amountIn, amountOutMin, path, msg.sender, block.timestamp);
//     }
// }

pragma solidity ^0.8.0;

interface IUniswap {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function WETH() external pure returns (address);
}

contract MyContract {
    IUniswap uniswap;

    constructor(address _uniswap) {
        uniswap = IUniswap(_uniswap);
    }

    function swapExactETHForTokens(uint256 amountOutMin, address token) external payable {
        address[] memory path = new address[](2);
        path[0] = uniswap.WETH();
        path[1] = token;
        uniswap.swapExactETHForTokens{value: msg.value}(amountOutMin, path, msg.sender, block.timestamp); // swapExactETHForTokens vs swapExactTokensForETH
    }
}
