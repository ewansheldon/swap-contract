const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('LiquidityPoolService', async () => {
  const INITIAL_SUPPLY = 1000000000000000;
  const ROUTER = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
  let service, seuro, tst, liquidityProvider;

  beforeEach(async () => {
    [ owner, liquidityProvider ] = await ethers.getSigners();
    const SEuro = await ethers.getContractFactory("SEuro");
    const StandardToken = await ethers.getContractFactory("StandardToken");
    const LiquidityPoolService = await ethers.getContractFactory("LiquidityPoolService");
    seuro = await SEuro.connect(owner).deploy("SEuro", "SEUR", INITIAL_SUPPLY);
    tst = await StandardToken.connect(owner).deploy("Standard Token", "TST", INITIAL_SUPPLY);
    service = await LiquidityPoolService.connect(owner).deploy(seuro.address, tst.address);
    await seuro.deployed();
    await tst.deployed();
    await service.deployed();
  });

  describe('empty pool', async() => {
    it('initialises the pool with no liquidity', async () => {
      const reserves = await service.getReserves();
  
      expect(reserves.reserveA.toString()).to.equal("0");
      expect(reserves.reserveB.toString()).to.equal("0");
    });
  
    it('will not provide a quote when no liquidity', async () => {
      try {
        await service.quote(seuro.address, 50000);
        throw new Error();
      } catch (error) {
        expect(error.message).contains("INSUFFICIENT_LIQUIDITY");
      }
  
      try {
        await service.quote(tst.address, 100000);
        throw new Error();
      } catch (error) {
        expect(error.message).contains("INSUFFICIENT_LIQUIDITY");
      }
    });
  });

  describe('initial liquidity', async () => {
    const DESIRED_A = 50000;
    const DESIRED_B = 50000;
    const MIN_A = 50000;
    const MIN_B = 50000;
    const NOW_PLUS_MINUTE = Math.floor(Date.now() / 1000);

    beforeEach(async () => {
      await seuro.connect(owner).transfer(liquidityProvider.address, DESIRED_A);
      await tst.connect(owner).transfer(liquidityProvider.address, DESIRED_B);
      await seuro.connect(liquidityProvider).approve(service.address, DESIRED_A);
      await tst.connect(liquidityProvider).approve(service.address, DESIRED_B);
    });

    it('allows you to add liquidity', async () => {
      await service.connect(liquidityProvider).addLiquidity(
        DESIRED_A, DESIRED_B, MIN_A, MIN_B, liquidityProvider.address, NOW_PLUS_MINUTE
      );
      const reserves = await service.getReserves();
  
      expect(reserves.reserveA.toString()).to.equal(DESIRED_A.toString());
      expect(reserves.reserveB.toString()).to.equal(DESIRED_B.toString());
    });
  
    it('prices tokens as same value when equal reserves', async () => {
      await service.connect(liquidityProvider).addLiquidity(
        DESIRED_A, DESIRED_B, MIN_A, MIN_B, liquidityProvider.address, NOW_PLUS_MINUTE
      );
      const desiredSwapAmount = 10000;

      const seuroPrice = await service.quote(seuro.address, desiredSwapAmount);
      const tstPrice = await service.quote(tst.address, desiredSwapAmount);

      expect(seuroPrice.toString()).to.equal(desiredSwapAmount.toString());
      expect(tstPrice.toString()).to.equal(desiredSwapAmount.toString());
    });
  });
});