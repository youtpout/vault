import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate } from 'o1js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class TokenHolder extends SmartContract {
    init() {
        super.init();
    }

    @method
    async withdraw(
        amount: UInt64
    ) {
        this.balance.subInPlace(amount);
        this.self.body.mayUseToken = AccountUpdate.MayUseToken.ParentsOwnToken;
    }
}
