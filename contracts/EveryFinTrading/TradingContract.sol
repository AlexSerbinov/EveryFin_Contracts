// SPDX-License-Identifier: UNLICENSED
/// @author "Oleksandr Serbinov";
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// NOTE when connect to frontend
// For swaps with tokens to exact(Tokens or Avax) need to add fee percentage to frontend
// For example If you wanna recieve exact 1000 USDT, you have to send 1001 USDC,
// But than proxy smart takes 1% from 1001 USDC, and your swap will fail.
// So, for recieving 1000 USDT, user have to send 1001+1% USDC

interface ITraderJoe {
    /// @notice Swaps exact AVAX for tokens while performing safety checks
    /// @param _amountOutMin The min amount of token to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapExactAVAXForTokens(
        uint256 _amountOutMin,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external payable;

    /// @notice Swaps tokens for exact AVAX while performing safety checks
    /// @param _amountAVAXOut The amount of AVAX to receive
    /// @param _amountInMax The max amount of token to send
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient. // Maybe shoud ne instead of msg.sender
    /// @param _deadline The deadline of the tx. // Read about this. It cac be set in swap window
    function swapTokensForExactAVAX(
        uint256 _amountAVAXOut,
        uint256 _amountInMax,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address payable _to,
        uint256 _deadline
    ) external;

    /// @notice Interface. Swaps exact tokens for tokens while performing safety checks
    /// @param _amountIn The amount of token to send
    /// @param _amountOutMin The min amount of token to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapExactTokensForTokens(
        uint256 _amountIn,
        uint256 _amountOutMin,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external;

    /// @notice Interface. Swaps tokens for exact tokens while performing safety checks
    /// @param _amountOut The amount of token to receive
    /// @param _amountInMax The max amount of token to send
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapTokensForExactTokens(
        uint256 _amountOut,
        uint256 _amountInMax,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external;

    /// @notice Interface. Swaps exact tokens for AVAX while performing safety checks
    /// @param _amountIn The amount of token to send
    /// @param _amountOutMinAVAX The min amount of AVAX to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapExactTokensForAVAX(
        uint256 _amountIn,
        uint256 _amountOutMinAVAX,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address payable _to,
        uint256 _deadline
    ) external;

    /// @notice Swaps AVAX for exact tokens while performing safety checks
    /// @dev Will refund any AVAX amount sent in excess to `msg.sender`
    /// @param _amountOut The amount of tokens to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapAVAXForExactTokens(
        uint256 _amountOut,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external payable;
}

contract TradingContract is AccessControlEnumerable, Pausable {
    using SafeERC20 for IERC20;
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public fee = 100;
    uint256 private maxApproval = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    IERC20 public wavax;
    ITraderJoe traderJoe;
    IERC20 private IERC20Token;

    event avaxWithdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);
    event FeeChanged(uint256 newFee);

    /// @param _traderJoe The address of TraderJoeV2Router02 contract
    /// @param _wavax The address of wraped native network token. AVAX for avalanche, WETH - for Etherum
    constructor(address _traderJoe, IERC20 _wavax) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(OWNER_ROLE, _msgSender());
        // _setRoleAdmin(DEFAULT_ADMIN_ROLE, OWNER_ROLE);

        traderJoe = ITraderJoe(_traderJoe);
        wavax = _wavax;
    }

    /// @notice Return the address of contract deployer
    /// @dev optional service functions needed for tests
    function getMsgSender() public view returns (address) {
        return _msgSender();
    }

    /// @notice The amount of earned reward in ERC20 tokens
    /// @notice The user is charged in every token. We cannot query the balance of all tokens at once.
    /// @notice So we need to insert the address as a parameter and request the balance of each token separately
    /// @param _tokenAddress The address of ERC20 token whose balance is being viewed
    function getContractTokenBalance(IERC20 _tokenAddress) public view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    /// @notice The amount of earned reward in native network coins (AVAX)
    /// @return AVAX balance of the contract
    function getContractAvaxBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice The amount of earned reward in native network coins (AVAX)
    /// @dev 1% = 100 untis. fee can not be bigger than 11%
    function setFeeInPercentage(uint256 _newFee) public {
        require(hasRole(OWNER_ROLE, _msgSender()), "Must have admin role to set fee");
        require(_newFee <= 1000, "The fee cannot be bigger than 10%");
        fee = _newFee;
        emit FeeChanged(_newFee);
    }

    /// @notice return the current fee in percentage
    /// @dev 1% = 100 untis. fee can not be bigger than 11%
    /// @return fee
    function getFee() public view returns (uint256) {
        return fee;
    }

    /// @notice Withdraw the earned ERC20 tokens profit
    /// @notice The user is charged in every token. We cannot query the balance of all tokens at once.
    /// @notice So we need to insert the address as a parameter and request the balance of each token separately
    /// @param _tokenAddress The address of ERC20 token whose balance is being withdrawed
    /// @param _to The address to receive the funds
    function withdrawTokenFee(IERC20 _tokenAddress, address _to) public {
        require(hasRole(OWNER_ROLE, _msgSender()), "Must have admin role to set fee");
        uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
        IERC20(_tokenAddress).safeTransfer(_to, balance);
        emit TokenWithdrawn(address(_tokenAddress), _to, balance);
    }

    /// @notice Withdraw the earned ERC20 tokens profit
    /// @param _to The address to receive the funds
    // Check how this role works !!!
    function withdrawAvaxFee(address payable _to) public {
        require(hasRole(OWNER_ROLE, _msgSender()), "Must have admin role to set fee");
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        uint256 thisBalance = address(this).balance;
        _safeTransferAVAX(_to, address(this).balance);
        emit avaxWithdrawn(_to, thisBalance);
    }

    /// @notice Function to receive Avax. msg.data must be empty
    receive() external payable {}

    /// @notice Fallback function is called when msg.data is not empty
    fallback() external payable {}

    /// @notice If a contract follows the ERC165 standard, it will publish what interfaces it supports.
    /// @notice Then, other contracts can utilize the published information to avoid calling unsupported functions.
    /// @return interfaceId Returns true if this contract implements the interface defined by interfaceId .
    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControlEnumerable).interfaceId || super.supportsInterface(interfaceId);
    } // check if needed

    /// @notice Swaps exact tokens for tokens while performing safety checks supporting for fee on transfer tokens
    /// @param _amountIn The amount of token to send
    /// @param _amountOutMin The min amount of token to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapExactTokensForTokens(
        uint256 _amountIn,
        uint256 _amountOutMin,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external {
        require(!paused(), "Token swap is not allowed while the contract is on pause");
        IERC20(_tokenPath[0]).safeTransferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenPath[0]).approve(address(traderJoe), maxApproval);
        uint256 sumMinusFee = _amountIn - ((_amountIn * fee) / 10000);
        traderJoe.swapExactTokensForTokens(sumMinusFee, _amountOutMin, _pairBinSteps, _tokenPath, _to, _deadline);
    }

    /// @notice Swaps tokens for exact tokens while performing safety checks
    /// @param _amountOut The amount of token to receive
    /// @param _amountInMax The max amount of token to send
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapTokensForExactTokens(
        uint256 _amountOut,
        uint256 _amountInMax,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external {
        require(!paused(), "Token swap is not allowed while the contract is on pause");
        uint256 tokenBalanceBeforeTransferUsersMoney = getContractTokenBalance(_tokenPath[0]);
        IERC20(_tokenPath[0]).safeTransferFrom(msg.sender, address(this), _amountInMax);
        IERC20(_tokenPath[0]).approve(address(traderJoe), maxApproval);
        uint256 feeFromFullSumm = (_amountInMax * fee) / 10000;
        uint256 sumToTraderJoe = _amountInMax - feeFromFullSumm;
        // If user send 101010 we will take 1000 as fee and will send 100000 to traderJoe
        traderJoe.swapTokensForExactTokens(_amountOut, sumToTraderJoe, _pairBinSteps, _tokenPath, _to, _deadline);
        uint256 tokenBalanceAfterSwap = getContractTokenBalance(_tokenPath[0]);
        uint256 spentPlusEveryFinFee = sumToTraderJoe - (tokenBalanceAfterSwap - tokenBalanceBeforeTransferUsersMoney - feeFromFullSumm); // require()
        uint256 notSpent = sumToTraderJoe - spentPlusEveryFinFee;

        IERC20(_tokenPath[0]).transfer(msg.sender, notSpent); // need security check
    }

    /// @notice Swaps exact tokens for AVAX while performing safety checks
    /// @param _amountIn The amount of token to send
    /// @param _amountOutMinAVAX The min amount of AVAX to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapExactTokensForAVAX(
        uint256 _amountIn,
        uint256 _amountOutMinAVAX,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external {
        require(!paused(), "Token swap is not allowed while the contract is on pause");
        IERC20(_tokenPath[0]).safeTransferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenPath[0]).approve(address(traderJoe), maxApproval);
        uint256 sumMinusFee = _amountIn - ((_amountIn * fee) / 10000);
        traderJoe.swapExactTokensForAVAX(sumMinusFee, _amountOutMinAVAX, _pairBinSteps, _tokenPath, payable(_to), _deadline);
    }

    /// @notice Swaps tokens for exact AVAX while performing safety checks
    /// @param _amountAVAXOut The amount of AVAX to receive
    /// @param _amountInMax The max amount of token to send
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient. // Maybe shoud ne instead of msg.sender
    /// @param _deadline The deadline of the tx. // Read about this. It cac be set in swap window
    function swapTokensForExactAVAX(
        uint256 _amountAVAXOut,
        uint256 _amountInMax,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external {
        require(!paused(), "Token swap is not allowed while the contract is on pause");
        uint256 tokenBalanceBeforeTransferUsersMoney = getContractTokenBalance(_tokenPath[0]);
        IERC20(_tokenPath[0]).safeTransferFrom(msg.sender, address(this), _amountInMax);
        uint256 feeFromFullSumm = (_amountInMax * fee) / 10000;
        uint256 sumToTraderJoe = _amountInMax - feeFromFullSumm;
        IERC20(_tokenPath[0]).approve(address(traderJoe), sumToTraderJoe);
        traderJoe.swapTokensForExactAVAX(_amountAVAXOut, sumToTraderJoe, _pairBinSteps, _tokenPath, payable(_to), _deadline);
        uint256 tokenBalanceAfterSwap = getContractTokenBalance(_tokenPath[0]);
        uint256 spentPlusEveryFinFee = sumToTraderJoe - (tokenBalanceAfterSwap - tokenBalanceBeforeTransferUsersMoney - feeFromFullSumm);
        uint256 notSpent = sumToTraderJoe - spentPlusEveryFinFee;
        IERC20(_tokenPath[0]).transfer(msg.sender, notSpent);
    }

    /// @notice Swaps exact AVAX for tokens while performing safety checks
    /// @param _amountOutMin The min amount of token to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    // / @param _to The address of the recipient
    // / @param _deadline The deadline of the tx
    function swapExactAVAXForTokens(
        uint256 _amountOutMin,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external payable {
        require(!paused(), "Token swap is not allowed while the contract is on pause");
        uint256 sumMinusFee = msg.value - ((msg.value * fee) / 10000);
        traderJoe.swapExactAVAXForTokens{ value: sumMinusFee }(_amountOutMin, _pairBinSteps, _tokenPath, _to, _deadline);
    }

    /// @notice Swaps AVAX for exact tokens while performing safety checks
    /// @dev Will refund any AVAX amount sent in excess to `msg.sender`
    /// @param _amountOut The amount of tokens to receive
    /// @param _pairBinSteps The bin step of the pairs (0: V1, other values will use V2)
    /// @param _tokenPath The swap path using the binSteps following `_pairBinSteps`
    /// @param _to The address of the recipient
    /// @param _deadline The deadline of the tx
    function swapAVAXForExactTokens(
        uint256 _amountOut,
        uint256[] memory _pairBinSteps,
        IERC20[] memory _tokenPath,
        address _to,
        uint256 _deadline
    ) external payable {
        require(!paused(), "Token swap is not allowed while the contract is on pause");
        if (_tokenPath[0] != IERC20(wavax)) revert("Acept only wavax");
        uint256 sumMinusFee = msg.value - ((msg.value * fee) / 10000);
        traderJoe.swapAVAXForExactTokens{ value: sumMinusFee }(_amountOut, _pairBinSteps, _tokenPath, _to, _deadline);
        uint256 avaxBalanceAfterSwap = address(this).balance;
        uint256 everyFinFee = msg.value - sumMinusFee;
        uint256 amountToSend = avaxBalanceAfterSwap - everyFinFee;
        _safeTransferAVAX(msg.sender, amountToSend);
    }

    /// @notice Pause all swap operations. Requirements: the caller must have the `PAUSER_ROLE`.
    function pause() public virtual {
        require(hasRole(OWNER_ROLE, _msgSender()), "Must have owner role to pause");
        _pause();
    }

    /// @notice Unpause all swap operations. Requirements: the caller must have the `PAUSER_ROLE`.
    function unpause() public virtual {
        require(hasRole(OWNER_ROLE, _msgSender()), "Must have owner role to unpause");
        _unpause();
    }

    /// @notice Helper function to transfer AVAX
    /// @param _to The address of the recipient
    /// @param _amount The AVAX amount to send
    function _safeTransferAVAX(address _to, uint256 _amount) private {
        (bool success, ) = _to.call{ value: _amount }("");
        if (!success) revert("AVAX transfer failed");
    }
}
