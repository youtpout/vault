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
        const balance = this.account.balance.getAndRequireEquals();
        Provable.log("balance", balance);
        balance.assertGreaterThanOrEqual(amount, "Balance less than withdrawal amount");

        this.balance.subInPlace(amount);
    }
}
