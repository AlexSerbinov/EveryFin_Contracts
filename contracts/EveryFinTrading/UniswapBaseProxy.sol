// // SPDX-License-Identifier: MIT

// pragma solidity ^0.6.6;

// import "hardhat/console.sol";

// interface IUniswap {
//     function swapExactETHForTokens(
//         uint256 amountOutMin,
//         address[] calldata path,
//         address to,
//         uint256 deadline
//     ) external payable returns (uint256[] memory amounts);

//     function WETH() external pure returns (address);

//     function swapExactTokensForETH(
//         uint256 amountIn,
//         uint256 amountOutMin,
//         address[] calldata path,
//         address to,
//         uint256 deadline
//     ) external returns (uint256[] memory amounts);
// }

// interface IERC20 {
//     function transferFrom(
//         address sender,
//         address recipient,
//         uint256 amount
//     ) external;

//     function approve(address spender, uint256 amount) external returns (bool);
// }

// contract UniswapBaseProxy {
//     IUniswap uniswap;

//     // Pass in address of UniswapV2Router02
//     constructor(address _uniswap) public {
//         uniswap = IUniswap(_uniswap);
//     }

//     function swapExactETHForTokens(uint256 amountOutMin, address token) external payable {
//         address[] memory path = new address[](2);
//         path[0] = uniswap.WETH();
//         path[1] = token;
//         // console.log("path[0] weth ", path);
//         console.log("path[1] erc20", path[1]);
//         // console.log("value: msg.value", msg.value);

//         uniswap.swapExactETHForTokens{value: msg.value}(amountOutMin, path, msg.sender, now);
//     }

//     function swapTokensForETH(
//         address token,
//         uint256 amountIn,
//         uint256 amountOutMin
//     ) external returns (bool) {
//         IERC20(token).transferFrom(msg.sender, address(this), amountIn);
//         address[] memory path = new address[](2);
//         path[0] = token;
//         path[1] = uniswap.WETH();
//         // console.log("path[1]", path[1]);
//         IERC20(token).approve(address(uniswap), amountIn);
//         uniswap.swapExactTokensForETH(amountIn, amountOutMin, path, msg.sender, block.timestamp);
//     }
// }
// // amountIn - The amount of input tokens to send.
// // amountOutMin - The minimum amount of output tokens that must be received for the transaction not to revert.
// // по идее курс тенятся откуда-то (сказали что надо тянуть с оракла) и я должен считать amountOutMin в зависимости
// // от подтянутого курса. Если я выставлю amountOutMin*90% , то слипедж будет 10 процентов. Так он и указывается.
