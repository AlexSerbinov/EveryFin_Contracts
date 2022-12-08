//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "hardhat/console.sol";

interface TraderJoeLendingInterface {
    // function greet() external view returns (string memory);
    function mintNative() external payable;
}

contract TraderJoeProxyStaking {
    address public constant OTHER_CONTRACT = 0xC22F01ddc8010Ee05574028528614634684EC29e;
    TraderJoeLendingInterface LendingContracts = TraderJoeLendingInterface(OTHER_CONTRACT);

    function testCall() public payable {
        LendingContracts.mintNative();
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other
     * function in the contract matches the call data.
     */
    // fallback() external payable {
    //     _fallback(); // Implement this
    // }

    // /**
    //  * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data
    //  * is empty.
    //  */
    // receive() external payable {
    //     _fallback(); // Implement this
    // }
}
