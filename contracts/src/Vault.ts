import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, TokenContractV2, Int64 } from 'o1js';
import { TokenStandard, TokenHolder, TokenA } from './index.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

/**
 * Pool contract for Lumina dex
 */
export class Vault extends TokenContractV2 {
    // we need the token address to instantiate it
    @state(PublicKey) tokenA = State<PublicKey>();
    @state(UInt64) liquiditySupply = State<UInt64>();

    init() {
        super.init();
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async initialize(tokenA: PublicKey) {
        const addressA = this.tokenA.getAndRequireEquals();
        addressA.isEmpty().assertTrue("Vault already initialised");
        this.tokenA.set(tokenA);
    }

    @method async deposit(amountA: UInt64, amountMina: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();

        addressA.isEmpty().assertFalse("Vault not initialised");

        amountA.assertGreaterThan(UInt64.zero, "No amount A supplied");
        amountMina.assertGreaterThan(UInt64.zero, "No amount Mina supplied");

        let tokenContractA = new TokenA(addressA);
        let dexX = AccountUpdate.create(this.address, tokenContractA.deriveTokenId());

        let sender = this.sender.getUnconstrained();
        let account = AccountUpdate.createSigned(sender);
        await tokenContractA.transfer(sender, dexX, amountA);
        await account.send({ to: this, amount: amountMina });


        let liquidityAmount = amountA.add(amountMina);
        // mint token
        this.internal.mint({ address: sender, amount: liquidityAmount });

        // set default informations
        this.liquiditySupply.set(liquidityAmount);
    }

    @method async withdraw(amountLiquidity: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();

        addressA.isEmpty().assertFalse("Vault not initialised");

        // todo implement withdraw
    }
}
