import { Field, SmartContract, state, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, Provable, AccountUpdate, TokenContractV2 } from 'o1js';
import { TokenA } from './index.js';

/**
 * Token holder contract, manage swap and liquidity remove functions
 */
export class TokenHolderV2 extends SmartContract {
    init() {
        super.init();
    }

    @method
    async withdraw(
        tokenA: PublicKey,
        amount: UInt64
    ) {
        const tokenContractA = new TokenA(tokenA);
        const tokenId = tokenContractA.deriveTokenId();
        const accountToken = AccountUpdate.default(this.address, tokenId);
        Provable.log("token id", tokenId);
        const balance = accountToken.account.balance.getAndRequireEquals();
        Provable.log("balance v2", balance);
        balance.assertGreaterThanOrEqual(amount, "Balance less than withdrawal amount");

        this.balance.subInPlace(amount);
    }
}
