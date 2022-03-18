const { expect } = require('chai');
const { ethers } = require('hardhat');

const NOW_PLUS_MINUTE = Math.floor(Date.now() / 1000);

describe('LiquidityPoolService', async () => {
  const INITIAL_SUPPLY = 1000000000000000;
  const ROUTER = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
  let liquidityPoolService, seuro, tst, liquidityProvider;

  beforeEach(async () => {
    [ owner, liquidityProvider ] = await ethers.getSigners();
    const SEuroContract = await ethers.getContractFactory("SEuro");
    const StandardTokenContract = await ethers.getContractFactory("StandardToken");
    const LiquidityPoolServiceContract = await ethers.getContractFactory("LiquidityPoolService");
    seuro = await SEuroContract.connect(owner).deploy("SEuro", "SEUR", INITIAL_SUPPLY);
    tst = await StandardTokenContract.connect(owner).deploy("Standard Token", "TST", INITIAL_SUPPLY);
    liquidityPoolService = await LiquidityPoolServiceContract.connect(owner).deploy(seuro.address, tst.address);
    await seuro.deployed();
    await tst.deployed();
    await liquidityPoolService.deployed();
  });

  describe('empty pool', async() => {
    it('initialises the pool with no liquidity', async () => {
      const reserves = await liquidityPoolService.getReserves();
  
      expect(reserves.reserveA.toString()).to.equal("0");
      expect(reserves.reserveB.toString()).to.equal("0");
    });
  
    it('will not provide a quote when no liquidity', async () => {
      try {
        await liquidityPoolService.quote(seuro.address, 50000);
        throw new Error();
      } catch (error) {
        expect(error.message).contains("INSUFFICIENT_LIQUIDITY");
      }
  
      try {
        await liquidityPoolService.quote(tst.address, 100000);
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

    beforeEach(async () => {
      await seuro.connect(owner).transfer(liquidityProvider.address, DESIRED_A);
      await tst.connect(owner).transfer(liquidityProvider.address, DESIRED_B);
      await seuro.connect(liquidityProvider).approve(liquidityPoolService.address, DESIRED_A);
      await tst.connect(liquidityProvider).approve(liquidityPoolService.address, DESIRED_B);
    });

    it('allows you to add liquidity', async () => {
      await liquidityPoolService.connect(liquidityProvider).addLiquidity(
        DESIRED_A, DESIRED_B, MIN_A, MIN_B, liquidityProvider.address, NOW_PLUS_MINUTE
      );
      const reserves = await liquidityPoolService.getReserves();
  
      expect(reserves.reserveA.toString()).to.equal(DESIRED_A.toString());
      expect(reserves.reserveB.toString()).to.equal(DESIRED_B.toString());
    });
  
    it('prices tokens as same value when equal reserves', async () => {
      await liquidityPoolService.connect(liquidityProvider).addLiquidity(
        DESIRED_A, DESIRED_B, MIN_A, MIN_B, liquidityProvider.address, NOW_PLUS_MINUTE
      );
      const desiredSwapAmount = 10000;

      const seuroPrice = await liquidityPoolService.quote(seuro.address, desiredSwapAmount);
      const tstPrice = await liquidityPoolService.quote(tst.address, desiredSwapAmount);

      expect(seuroPrice.toString()).to.equal(desiredSwapAmount.toString());
      expect(tstPrice.toString()).to.equal(desiredSwapAmount.toString());
    });
  });

  describe('pairs', async () => {
    it('always gets the same pair for pool', async () => {
      const pair = await liquidityPoolService.getPair();
      expect(pair).to.be.a('string');
      expect(pair).not.to.be.empty;

      const pairAgain = await liquidityPoolService.getPair();
      expect(pairAgain).to.equal(pair);
    });
  });

  describe('liquidity pool tokens', async () => {
    //
    // write some tests about how many tokens are minted depending on reserves, ratios and liquidity added
    //
    const DESIRED_A = 50000;
    const DESIRED_B = 50000;
    let liquidityPoolToken;

    beforeEach(async () => {
      const ERC20 = await ethers.getContractFactory("ERC20");
      liquidityPoolToken = ERC20.attach(await liquidityPoolService.getPair());
      await seuro.connect(owner).transfer(liquidityProvider.address, DESIRED_A);
      await tst.connect(owner).transfer(liquidityProvider.address, DESIRED_B);
      await seuro.connect(liquidityProvider).approve(liquidityPoolService.address, DESIRED_A);
      await tst.connect(liquidityProvider).approve(liquidityPoolService.address, DESIRED_B);
    });

    it('grants liquidity pool tokens to the provider', async () => {
      expect((await liquidityPoolToken.balanceOf(liquidityProvider.address)).toString()).to.equal("0");
      
      const addLiquidity = await liquidityPoolService.connect(liquidityProvider).addLiquidity(
        DESIRED_A, DESIRED_B, 1, 1, liquidityProvider.address, NOW_PLUS_MINUTE
      );
      const lpTokensAmount = (await addLiquidity.wait())
        .events.filter(e => e.event == "LiquidityAdded")
        .map(e => e.args.poolTokens.toString())
        [0];

      expect((await liquidityPoolToken.balanceOf(liquidityProvider.address)).toString())
        .to.equal(lpTokensAmount);
    });
  });

  describe('removing liquidity', async () => {
    const DESIRED_A = 10000000000;
    const DESIRED_B = 10000000000;
    const MINIMUM_LIQUIDITY = 1000;
    let liquidityPoolToken;

    beforeEach(async () => {
      const ERC20 = await ethers.getContractFactory("ERC20");
      liquidityPoolToken = ERC20.attach(await liquidityPoolService.getPair());

      await seuro.connect(owner).transfer(liquidityProvider.address, DESIRED_A);
      await tst.connect(owner).transfer(liquidityProvider.address, DESIRED_B);
      await seuro.connect(liquidityProvider).approve(liquidityPoolService.address, DESIRED_A);
      await tst.connect(liquidityProvider).approve(liquidityPoolService.address, DESIRED_B);
    });

    it('will remove liquidity in exchange for pool tokens up to minimum liquidity', async () => {
      const addLiquidity = await liquidityPoolService.connect(liquidityProvider).addLiquidity(
        DESIRED_A, DESIRED_B, 1, 1, liquidityProvider.address, NOW_PLUS_MINUTE
      );
      const lpTokensAmount = (await addLiquidity.wait())
        .events.filter(e => e.event == "LiquidityAdded")
        .map(e => e.args.poolTokens)
        [0];
      liquidityPoolToken.connect(liquidityProvider).approve(liquidityPoolService.address, lpTokensAmount);

      await liquidityPoolService.connect(liquidityProvider).removeLiquidity(
        lpTokensAmount, 1, 1, liquidityProvider.address, NOW_PLUS_MINUTE
      );

      const { reserveA, reserveB } = await liquidityPoolService.getReserves();
      expect((await liquidityPoolToken.balanceOf(liquidityProvider.address)).toString())
        .to.equal("0");
      expect(reserveA.toString()).to.equal(MINIMUM_LIQUIDITY.toString());
      expect(reserveB.toString()).to.equal(MINIMUM_LIQUIDITY.toString());
    });
  });
});