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
        this.balance.subInPlace(amount);
    }
}
