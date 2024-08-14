import { Account, AccountUpdate, Bool, Field, Int64, Mina, PrivateKey, PublicKey, TokenContract, UInt64 } from 'o1js';

import { TokenHolder, Vault, TokenA, VaultDeployProps, TokenHolderV2, VaultV2, VaultV2DeployProps } from './index.js';

let proofsEnabled = false;

describe('Vault v2', () => {
    let deployerAccount: Mina.TestPublicKey,
        deployerKey: PrivateKey,
        senderAccount: Mina.TestPublicKey,
        senderKey: PrivateKey,
        bobAccount: Mina.TestPublicKey,
        bobKey: PrivateKey,
        aliceAccount: Mina.TestPublicKey,
        aliceKey: PrivateKey,
        zkAppAddress: PublicKey,
        zkAppPrivateKey: PrivateKey,
        zkApp: VaultV2,
        zkToken0Address: PublicKey,
        zkToken0PrivateKey: PrivateKey,
        zkToken0: TokenA,
        tokenHolder: TokenHolderV2;

    beforeAll(async () => {
        if (proofsEnabled) {
            console.time('compile pool');
            const tokenKey = await TokenA.compile();
            const key = await VaultV2.compile();
            await TokenHolderV2.compile();
            console.timeEnd('compile pool');
        }
    });

    beforeEach(async () => {
        const Local = await Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        [deployerAccount, senderAccount, bobAccount, aliceAccount] = Local.testAccounts;
        deployerKey = deployerAccount.key;
        senderKey = senderAccount.key;
        bobKey = bobAccount.key;
        aliceKey = aliceAccount.key;

        zkAppPrivateKey = PrivateKey.random();
        zkAppAddress = zkAppPrivateKey.toPublicKey();
        zkApp = new VaultV2(zkAppAddress);

        zkToken0PrivateKey = PrivateKey.random();
        zkToken0Address = zkToken0PrivateKey.toPublicKey();
        zkToken0 = new TokenA(zkToken0Address);

        const args: VaultV2DeployProps = { tokenA: zkToken0Address };
        let txn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 2);
            await zkApp.deploy(args);
            await zkToken0.deploy();
        });
        await txn.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey]).send();

        tokenHolder = new TokenHolderV2(zkAppAddress, zkToken0.deriveTokenId());
        txn = await Mina.transaction(senderAccount, async () => {
            AccountUpdate.fundNewAccount(senderAccount, 1);
            await tokenHolder.deploy();
            await zkToken0.approveAccountUpdate(tokenHolder.self);
        });
        //console.log("initialize", txn.toPretty());
        await txn.prove();
        await txn.sign([senderKey, zkAppPrivateKey]).send();

        await mintToken(senderAccount);

    });

    it('deposit vault', async () => {

        let amt = UInt64.from(10 * 10 ** 9);

        const txn2 = await Mina.transaction(senderAccount, async () => {
            await zkApp.deposit(amt);
        });
        //console.log("deposit", txn2.toPretty());
        await txn2.prove();
        await txn2.sign([senderKey]).send();

        const balanceToken = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
        expect(balanceToken.value).toEqual(amt.value);
    });

    it('withdraw vault', async () => {
        let amt = UInt64.from(10 * 10 ** 9);

        const txn2 = await Mina.transaction(senderAccount, async () => {
            await zkApp.deposit(amt);
        });
        //console.log("deposit", txn2.toPretty());
        await txn2.prove();
        await txn2.sign([senderKey]).send();

        const withdrawAmt = UInt64.from(1000);
        const txn3 = await Mina.transaction(senderAccount, async () => {
            await zkApp.withdraw(withdrawAmt);
        });
        console.log("withdraw", txn3.toPretty());
        await txn3.prove();
        await txn3.sign([senderKey]).send();

        const balanceToken = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
        const expected = amt.sub(withdrawAmt);
        expect(balanceToken.value).toEqual(expected.value);

    });

    function showBalanceToken0() {
        let bal = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
        console.log("balance token user", bal.toBigInt());
        return bal;
    }

    function showBalanceToken1() {
        let bal = Mina.getBalance(senderAccount);
        console.log("balance mina user", bal.toBigInt());
        return bal;
    }

    async function mintToken(user: PublicKey) {
        // update transaction
        const txn = await Mina.transaction(senderAccount, async () => {
            AccountUpdate.fundNewAccount(senderAccount, 1);
            await zkToken0.mintTo(user, UInt64.from(1000 * 10 ** 9));
        });
        await txn.prove();
        await txn.sign([senderKey, zkToken0PrivateKey]).send();

    }

});