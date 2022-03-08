const { expect } = require('chai');
const Web3 = require('web3');

describe('LiquidityPoolService', async () => {
  let service, ewan, sheldon;

  before(async () =>{
    const EwanToken = await ethers.getContractFactory("EwanToken");
    const SheldonToken = await ethers.getContractFactory("SheldonToken");
    const LiquidityPoolService = await ethers.getContractFactory("LiquidityPoolService");
    ewan = await EwanToken.deploy("Ewan", "EWA");
    sheldon = await SheldonToken.deploy("Sheldon", "EWA");
    service = await LiquidityPoolService.deploy(ewan.address, sheldon.address);
    await ewan.deployed();
    await sheldon.deployed();
    await service.deployed();
  });

  it('initialises the pool with no liquidity', async () => {
    const reserves = await service.getReserves();

    expect(reserves.reserveA.toString()).to.equal("0");
    expect(reserves.reserveB.toString()).to.equal("0");
  });

  // it('initialises prices as identical', async () => {
  //   const quoteA = await service.quote(ewan, 50000);
  //   const quoteB = await service.quote(sheldon, 100000);

  //   expect(quoteA.toString()).to.equal("50000");
  //   expect(quoteB.toString()).to.equal("100000");
  // });

  // it('allows you to add liquidity', async () => {

  //   await service.addLiquidity(
  //     desiredA, desiredB, minA, minB, provider, nowPlusMinute
  //   )
  // });
});