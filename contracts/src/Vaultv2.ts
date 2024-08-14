import { Field, SmartContract, Permissions, state, State, method, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, TokenContractV2, Int64 } from 'o1js';
import { TokenHolder, TokenA, TokenHolderV2 } from './index.js';

// minimum liquidity permanently locked in the pool
export const minimunLiquidity: UInt64 = new UInt64(10 ** 3);

export interface VaultV2DeployProps extends Exclude<DeployArgs, undefined> {
    tokenA: PublicKey;
}

/**
 * Pool contract for Lumina dex
 */
export class VaultV2 extends SmartContract {
    // we need the token address to instantiate it
    @state(PublicKey) tokenA = State<PublicKey>();
    @state(UInt64) liquiditySupply = State<UInt64>();

    async deploy(args: VaultV2DeployProps) {
        await super.deploy(args);
        args.tokenA.isEmpty().assertFalse("token empty");

        this.tokenA.set(args.tokenA);
    }


    @method async deposit(amount: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();

        amount.assertGreaterThan(UInt64.zero, "No amount A supplied");

        let tokenContractA = new TokenA(addressA);
        let dexX = AccountUpdate.create(this.address, tokenContractA.deriveTokenId());

        let sender = this.sender.getUnconstrained();
        await tokenContractA.transfer(sender, dexX, amount);
    }

    @method async withdraw(amount: UInt64) {
        const addressA = this.tokenA.getAndRequireEquals();
        const tokenContractA = new TokenA(addressA);

        const holder = new TokenHolderV2(this.address, tokenContractA.deriveTokenId());
        await holder.withdraw(addressA, amount);

        const sender = this.sender.getUnconstrained();
        await tokenContractA.transfer(holder.self, sender, amount);
    }
}
