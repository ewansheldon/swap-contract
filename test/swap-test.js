const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('LiquidityPoolService', async () => {
  const INITIAL_SUPPLY = 1000000000000000;
  const ROUTER = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
  let service, ewan, sheldon, liquidityProvider;

  beforeEach(async () => {
    [ owner, liquidityProvider ] = await ethers.getSigners();
    const EwanToken = await ethers.getContractFactory("EwanToken");
    const SheldonToken = await ethers.getContractFactory("SheldonToken");
    const LiquidityPoolService = await ethers.getContractFactory("LiquidityPoolService");
    ewan = await EwanToken.connect(owner).deploy("Ewan", "EWA", INITIAL_SUPPLY);
    sheldon = await SheldonToken.connect(owner).deploy("Sheldon", "SHE", INITIAL_SUPPLY);
    service = await LiquidityPoolService.connect(owner).deploy(ewan.address, sheldon.address);
    await ewan.deployed();
    await sheldon.deployed();
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
        await service.quote(ewan.address, 50000);
        throw new Error();
      } catch (error) {
        expect(error.message).contains("INSUFFICIENT_LIQUIDITY");
      }
  
      try {
        await service.quote(sheldon.address, 100000);
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
      await ewan.connect(owner).transfer(liquidityProvider.address, DESIRED_A);
      await sheldon.connect(owner).transfer(liquidityProvider.address, DESIRED_B);
      await ewan.connect(liquidityProvider).approve(service.address, DESIRED_A);
      await sheldon.connect(liquidityProvider).approve(service.address, DESIRED_B);
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

      const ewanPrice = await service.quote(ewan.address, desiredSwapAmount);
      const sheldonPrice = await service.quote(sheldon.address, desiredSwapAmount);

      expect(ewanPrice.toString()).to.equal(desiredSwapAmount.toString());
      expect(sheldonPrice.toString()).to.equal(desiredSwapAmount.toString());
    });
  });
});