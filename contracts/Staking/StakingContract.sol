// SPDX-License-Identifier: UNLICENSED
/// @author "Oleksandr Serbinov";
pragma solidity ^0.8.17;

// Importing required libraries and contracts
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

// Interface for the BenqiStaking contract. It is required to interact with the contract functions.
interface IBenqiStaking is IERC20Upgradeable {
    function initialize(uint _cooldownPeriod, uint _redeemPeriod) external;

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function transfer(address recipient, uint amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint amount) external returns (bool);

    // Function to submit the staking. This function will return the amount staked.
    function submit() external payable returns (uint);
}

// Main contract which will interact with the BenqiStaking contract
contract StakingContract is AccessControlEnumerable, Pausable {
    using SafeERC20 for IERC20;

    // Definition of different roles for access control
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // Fee for the proxy service, can be changed by the contract owner
    uint256 public fee = 100;
    // Instance of the BenqiStaking contract
    IBenqiStaking benqiStaking;

    // Events that will be emitted in different functions
    event avaxWithdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);
    event FeeChanged(uint256 newFee);

    // The constructor function which will initialize the BenqiStaking contract instance and set up roles
    constructor(address _benqiStaking) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(OWNER_ROLE, _msgSender());
        benqiStaking = IBenqiStaking(_benqiStaking);
    }

    // Function to submit the staking. It calculates the fee, performs the staking and transfers the staked tokens to the user.
    /// @notice Submits an amount of AVAX tokens for staking in the benqiStaking contract.
    /// @notice A fee is deducted from the submitted amount, which is set in the 'fee' state variable.
    /// @notice The function will revert if the submit function of the benqiStaking contract does not return a positive value.
    /// @return Returns the amount of staked sAVAX tokens.
    function submit() public payable returns (uint) {
        require(!paused(), "Token swap is not allowed while the contract is on pause");
        uint256 feeFromFullSumm = (msg.value * fee) / 10000; // Calculating fee from the full sum
        uint256 sumToSubmit = msg.value - feeFromFullSumm; // Deducting fee from the full sum
        // Executing submit function from BenqiStaking contract
        uint shareAmount = benqiStaking.submit{ value: sumToSubmit }();
        // Making sure that submit function returned a valid amount of tokens
        require(shareAmount > 0, "The submit operation did not return tokens");
        // Transferring staked tokens to the user
        benqiStaking.transfer(_msgSender(), shareAmount);
        // Returning the amount of staked tokens for further use in the frontend
        return shareAmount;
    }

    /// @notice The amount of earned reward in ERC20 tokens
    /// @notice The user is charged in every token. We cannot query the balance of all tokens at once.
    /// @notice So we need to insert the address as a parameter and request the balance of each token separately
    function getContractSavaxBalance() public view returns (uint256) {
        return benqiStaking.balanceOf(address(this));
    }

    /// @notice Returns the balance of sAVAX tokens for a specified user.
    /// @param _user The address of the user for whom the balance is being requested.
    /// @return Returns the balance of the sAVAX tokens for the specified user.
    function getUerSavaxBalance(address _user) public view returns (uint256) {
        return benqiStaking.balanceOf(_user);
    }

    /// @notice Return the address of contract deployer
    /// @dev optional service functions needed for tests
    function getMsgSender() public view returns (address) {
        return _msgSender();
    }

    /// @notice The amount of earned reward in native network coins (AVAX)
    /// @return AVAX balance of the contract
    function getContractAvaxBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice The amount of earned reward in native network coins (AVAX)
    /// @dev 1% = 100 untis. fee can not be bigger than 10%
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
