// SPDX-License-Identifier: MIT
pragma solidity <=0.8.12;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "./interfaces/IERC20.sol";

contract LiquidityPoolService {
    event Balance(uint256 balance);
    event LiquidityAdded(uint amountA, uint amountB, uint poolTokens);

    address constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address constant ROUTER = 0xf164fC0Ec4E93095b804a4795bBe1e041497b92a;

    address private tokenA;
    address private tokenB;
    IUniswapV2Factory factory;
    IUniswapV2Router01 router;

    constructor(address _tokenA, address _tokenB) public {
        tokenA = _tokenA;
        tokenB = _tokenB;
        initialisePair();
        initialiseRouter();
    }

    function initialisePair() private {
        factory = IUniswapV2Factory(FACTORY);
        factory.createPair(tokenA, tokenB);
    }

    function initialiseRouter() private {
        router = IUniswapV2Router01(ROUTER);
    }

    function getPair() public view returns (address pair) {
        return factory.getPair(tokenA, tokenB);
    }

    function getReserves() public view returns (uint256 reserveA, uint256 reserveB) {
        (reserveA, reserveB) = UniswapV2Library.getReserves(FACTORY, tokenA, tokenB);
    }

    function quote(address _token, uint256 _amount) public view returns (uint256 amount) {
        (uint256 reserveA, uint256 reserveB) = getReserves();
        if (_token == tokenA) {
            amount = UniswapV2Library.quote(_amount, reserveA, reserveB);
        } else {
            amount = UniswapV2Library.quote(_amount, reserveB, reserveA);
        }
    }

    function addLiquidity(
        uint256 _desiredA,
        uint256 _desiredB,
        uint256 _minA,
        uint256 _minB,
        address _provider,
        uint256 _deadline
    ) public returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        IERC20 ercTokenA = IERC20(tokenA);
        IERC20 ercTokenB = IERC20(tokenB);
        ercTokenA.transferFrom(msg.sender, address(this), _desiredA);
        ercTokenB.transferFrom(msg.sender, address(this), _desiredB);
        ercTokenA.approve(ROUTER, _desiredA);
        ercTokenB.approve(ROUTER, _desiredB);
        (amountA, amountB, liquidity) = router.addLiquidity(tokenA, tokenB, _desiredA, _desiredB, _minA, _minB, _provider, _deadline);
        emit LiquidityAdded(amountA, amountB, liquidity);
    }

    function removeLiquidity(
        uint256 _amount,
        uint256 _minAmountA,
        uint256 _minAmountB,
        address _to,
        uint256 _deadline
    ) public returns (uint256 amountA, uint256 amountB) {
        IERC20 lpToken = IERC20(getPair());
        lpToken.transferFrom(msg.sender, address(this), _amount);
        lpToken.approve(ROUTER, _amount);
        (amountA, amountB) = router.removeLiquidity(tokenA, tokenB, _amount, _minAmountA, _minAmountB, _to, _deadline);
    }
}
