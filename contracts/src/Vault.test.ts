import { Account, AccountUpdate, Bool, Field, Int64, Mina, PrivateKey, PublicKey, TokenContract, UInt64 } from 'o1js';

import { TokenStandard, TokenHolder, Vault, TokenA } from './index.js';

let proofsEnabled = true;

describe('Vault', () => {
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
        zkApp: Vault,
        zkToken0Address: PublicKey,
        zkToken0PrivateKey: PrivateKey,
        zkToken0: TokenA,
        tokenHolder0: TokenHolder;

    beforeAll(async () => {
        if (proofsEnabled) {
            console.time('compile pool');
            await TokenStandard.compile();
            const tokenKey = await TokenA.compile();
            const key = await Vault.compile();
            await TokenHolder.compile();
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
        zkApp = new Vault(zkAppAddress);

        zkToken0PrivateKey = PrivateKey.random();
        zkToken0Address = zkToken0PrivateKey.toPublicKey();
        zkToken0 = new TokenA(zkToken0Address);

        const txn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount, 2);
            await zkApp.deploy();
            await zkToken0.deploy();
        });
        await txn.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey]).send();

        // tokenHolder0 = new TokenHolder(zkAppAddress, zkToken0.deriveTokenId());

        // const txn2 = await Mina.transaction(deployerAccount, async () => {
        //     AccountUpdate.fundNewAccount(deployerAccount, 1);
        //     await tokenHolder0.deploy();
        //     await zkToken0.approveAccountUpdate(tokenHolder0.self);
        // });
        // await txn2.prove();
        // // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        // await txn2.sign([deployerKey, zkAppPrivateKey]).send();

        // mint token to user
        await mintToken(senderAccount);

    });

    it('initialize vault', async () => {
        let amt = UInt64.from(10 * 10 ** 9);

        const txn = await Mina.transaction(senderAccount, async () => {
            AccountUpdate.fundNewAccount(senderAccount, 2);
            let account = AccountUpdate.create(senderAccount, zkApp.deriveTokenId());
            let account2 = AccountUpdate.create(zkAppAddress, zkToken0.deriveTokenId());
            await zkApp.initialize(zkToken0Address);
            await zkApp.approveAccountUpdate(account);
            await zkToken0.approveAccountUpdate(account2);
        });
        //console.log("initialize", txn.toPretty());
        await txn.prove();
        await txn.sign([senderKey, zkAppPrivateKey]).send();
    });

    it('deposit vault', async () => {

        const txn = await Mina.transaction(senderAccount, async () => {
            AccountUpdate.fundNewAccount(senderAccount, 2);
            let account = AccountUpdate.create(senderAccount, zkApp.deriveTokenId());
            let account2 = AccountUpdate.create(zkAppAddress, zkToken0.deriveTokenId());
            await zkApp.initialize(zkToken0Address);
            await zkApp.approveAccountUpdate(account);
            await zkToken0.approveAccountUpdate(account2);
        });
        await txn.prove();
        await txn.sign([senderKey, zkAppPrivateKey]).send();

        let amt = UInt64.from(10 * 10 ** 9);

        const txn2 = await Mina.transaction(senderAccount, async () => {
            await zkApp.deposit(amt, amt);
        });
        console.log("deposit", txn2.toPretty());
        await txn2.prove();
        await txn2.sign([senderKey]).send();
        const liquidityUser = Mina.getBalance(senderAccount, zkApp.deriveTokenId());
        const expected = amt.value.add(amt.value);
        console.log("liquidity user", liquidityUser.toString());
        expect(liquidityUser.value).toEqual(expected);

        const balance = Mina.getBalance(zkAppAddress);
        expect(balance.value).toEqual(amt.value);

        const balanceToken = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
        expect(balance.value).toEqual(amt.value);
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