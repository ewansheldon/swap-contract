const { expect } = require('chai');
const { ethers } = require('hardhat');
const { utils } = require('web3');
const { BN } = utils;

describe('LiquidityPoolService', async () => {
  const INITIAL_SUPPLY = 1000000000000000;
  const ROUTER = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
  let service, ewan, sheldon, liquidityProvider;

  before(async () => {
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

  it('allows you to add liquidity', async () => {
    const desiredA = 50000;
    const desiredB = 50000;
    const minA = 50000;
    const minB = 50000;
    const nowPlusMinute = Math.floor(Date.now() / 1000);
    await ewan.connect(owner).transfer(liquidityProvider.address, desiredA);
    await sheldon.connect(owner).transfer(liquidityProvider.address, desiredB);
    await ewan.connect(liquidityProvider).approve(service.address, desiredA);
    await sheldon.connect(liquidityProvider).approve(service.address, desiredB);
    await service.connect(liquidityProvider).addLiquidity(
      desiredA, desiredB, minA, minB, liquidityProvider.address, nowPlusMinute
    );
  });
});