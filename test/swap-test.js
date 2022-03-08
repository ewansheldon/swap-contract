const chai = require('chai');
const Web3 = require('web3');

describe('LiquidityPoolService', async () => {
  it('gets the pool information for the given tokens', async () => {
    const EwanToken = await ethers.getContractFactory("EwanToken");
    const SheldonToken = await ethers.getContractFactory("SheldonToken");
    const LiquidityPoolService = await ethers.getContractFactory("LiquidityPoolService");
    const ewan = await EwanToken.deploy("Ewan", "EWA");
    const sheldon = await SheldonToken.deploy("Sheldon", "EWA");
    const service = await LiquidityPoolService.deploy(ewan.address, sheldon.address);
    await ewan.deployed();
    await sheldon.deployed();
    await service.deployed();
    const pair = await service.getPair();
    const reserves = await service.getReserves();
    console.log(reserves.reserveA.toString())
    console.log(reserves.reserveB.toString())





    // const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    // const DAI_WHALE = '0xe78388b4ce79068e89bf8aa7f218ef6b9ab0e9d0';
    // const dai = await ethers.getContractAt("IERC20", DAI);
    // const daiWhaleBalance = await dai.balanceOf(DAI_WHALE);
    // console.log(daiWhaleBalance.toString());
    // const dai = await IERC20.at(DAI);
  });
});