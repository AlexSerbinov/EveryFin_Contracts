// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface PriceAggregator {
    /*
        WARNING!
        Usage of the dex oracle on chain is highly discouraged!
        getRate function can be easily manipulated inside transaction!
    */
    function getRate(address srcToken, address dstToken, bool useWrappers) external view returns (uint256 weightedRate);
}

contract Price {
    PriceAggregator internal aggregator;
    uint256 public priceAbiEncode;
    uint256 public priceInterface;

    constructor() {
        aggregator = PriceAggregator(0xBd0c7AaF0bF082712EbE919a9dD94b2d978f79A9);
    }

    function callWithAbiEncode(address _token1, address _token2, bool useWrappers) public {
        address aggregatorContract = 0xBd0c7AaF0bF082712EbE919a9dD94b2d978f79A9;
        (bool success, bytes memory data) = aggregatorContract.staticcall(
            abi.encodeWithSignature("getRate(address,address,bool)", _token1, _token2, useWrappers)
        );
        // succes = false, but data is successfully received
        // require(success != true, "staticCall unsuccessful");
        priceAbiEncode = abi.decode(data, (uint256));
    }

    function callWithInterface(address _token1, address _token2, bool useWrappers) public {
        priceInterface = aggregator.getRate(_token1, _token2, useWrappers);
    }
}