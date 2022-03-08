// SPDX-License-Identifier: MIT
pragma solidity <=0.8.12;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

contract LiquidityPoolService {
    address constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

    address private tokenA;
    address private tokenB;
    IUniswapV2Factory factory;

    constructor(address _tokenA, address _tokenB) public {
        tokenA = _tokenA;
        tokenB = _tokenB;
        factory = IUniswapV2Factory(FACTORY);
        factory.createPair(tokenA, tokenB);
    }

    function getPair() public view returns(IUniswapV2Pair) {
        return IUniswapV2Pair(factory.getPair(tokenA, tokenB));
    }

    function getReserves() public view returns(uint reserveA, uint reserveB) {
        (reserveA, reserveB) = UniswapV2Library.getReserves(FACTORY, tokenA, tokenB);
    }
}