const { expect } = require('chai');
const { ethers } = require('hardhat');
const Web3 = require('web3');

describe('LiquidityPoolService', async () => {
  let service, ewan, sheldon, owner;

  before(async () => {
    const EwanToken = await ethers.getContractFactory("EwanToken");
    const SheldonToken = await ethers.getContractFactory("SheldonToken");
    const LiquidityPoolService = await ethers.getContractFactory("LiquidityPoolService");
    ewan = await EwanToken.deploy("Ewan", "EWA");
    sheldon = await SheldonToken.deploy("Sheldon", "EWA");
    service = await LiquidityPoolService.deploy(ewan.address, sheldon.address);
    [ provider ] = await ethers.getSigners();
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
    await service.addLiquidity(
      desiredA, desiredB, minA, minB, provider.address, nowPlusMinute
    );
  });
});