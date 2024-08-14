import { Field, SmartContract, Permissions, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, TokenContractV2 } from 'o1js';

/**
 * Token created for tests
 */
export class TokenA extends TokenContractV2 {

    async deploy(args?: DeployArgs) {
        await super.deploy(args);
        this.account.tokenSymbol.set("TV2");

        const sender = this.sender.getUnconstrained();

        // mint to deployer
        this.internal.mint({
            address: sender,
            amount: UInt64.MAXINT(),
        });
    }


    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async mintTo(to: PublicKey, amount: UInt64) {
        this.internal.mint({ address: to, amount });
    }

}
