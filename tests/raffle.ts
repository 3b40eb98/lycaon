/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as anchor from '@project-serum/anchor';
import { Program, BN } from '@project-serum/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Raffle } from '../target/types/raffle';
import { creatMintToken, fundATA } from './utils';

describe('raffle', () => {
  const provider = anchor.getProvider();

  anchor.setProvider(provider);

  const { connection } = provider;

  const program = anchor.workspace.Raffle as Program<Raffle>;

  const payer = anchor.web3.Keypair.generate();
  const bank = anchor.web3.Keypair.generate();

  let tokenMint: PublicKey;
  let tokenAcc: PublicKey;
  let bankAcc: PublicKey;
  let raffleEx: PublicKey;

  const today = new Date();
  const todayTimestamp = today.getTime();

  const todayPlus5Days = new Date();
  todayPlus5Days.setDate(todayPlus5Days.getDate() + 5);
  const todayPlus5DaysTimeStamp = todayPlus5Days.getTime();

  before('fund wallet', async () => {
    const bankFund = await program.provider.connection.requestAirdrop(
      bank.publicKey,
      50 * anchor.web3.LAMPORTS_PER_SOL
    );

    const payerFund = await program.provider.connection.requestAirdrop(
      payer.publicKey,
      50 * anchor.web3.LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(bankFund);
    await program.provider.connection.confirmTransaction(payerFund);
  });

  before('create mint token', async () => {
    const token = await creatMintToken(connection, payer);

    tokenAcc = await fundATA(token, payer, payer.publicKey, 10000);
    bankAcc = await fundATA(token, payer, bank.publicKey, 0);

    tokenMint = token.publicKey;

    console.log({
      tokenMint: token.publicKey.toBase58(),
      tokenAcc: token.publicKey.toBase58(),
      bankAcc: bankAcc.toBase58(),
    });
  });

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log('Your transaction signature', tx);
  });

  it('Create bank', async () => {
    console.log('bank address', bank.publicKey.toBase58());

    await program.rpc.initBank({
      accounts: {
        bank: bank.publicKey,
        bankManager: payer.publicKey,
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [bank, payer],
    });

    const bankAccount = await program.account.bank.fetch(bank.publicKey);

    assert.equal(
      bankAccount.bankManager.toBase58(),
      payer.publicKey.toBase58()
    );

    assert(bankAccount.rafflesCount.eq(new BN(0)));
  });

  it('Create raffle', async () => {
    const raffle = anchor.web3.Keypair.generate();
    const raffle2 = anchor.web3.Keypair.generate();

    const entrants = anchor.web3.Keypair.generate();
    const entrants2 = anchor.web3.Keypair.generate();

    await program.rpc.createRaffle(
      'Raffle 1',
      'url.com',
      new BN(1),
      new BN(5),
      new BN(todayTimestamp),
      new BN(todayPlus5DaysTimeStamp),
      new BN(20),
      new BN(2),
      {
        accounts: {
          bank: bank.publicKey,
          raffle: raffle.publicKey,
          entrants: entrants.publicKey,
          tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        instructions: [
          await program.account.entrants.createInstruction(entrants),
        ],
        signers: [payer, raffle, entrants],
      }
    );

    await program.rpc.createRaffle(
      'Raffle 2',
      'url.com',
      new BN(1),
      new BN(5),
      new BN(todayTimestamp),
      new BN(todayPlus5DaysTimeStamp),
      new BN(20),
      new BN(2),
      {
        accounts: {
          bank: bank.publicKey,
          raffle: raffle2.publicKey,
          entrants: entrants2.publicKey,
          tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        instructions: [
          await program.account.entrants.createInstruction(entrants2),
        ],
        signers: [payer, raffle2, entrants2],
      }
    );

    const raffleAccount = await program.account.raffle.fetch(raffle.publicKey);

    const raffleAccount2 = await program.account.raffle.fetch(
      raffle2.publicKey
    );

    console.log({
      entrantsPubkey: raffleAccount.entrants.toBase58(),
      entrantsKeyPair: entrants.publicKey.toBase58(),
      entrantsSize: program.account.entrants.size,
    });

    assert.equal(raffleAccount.name, 'Raffle 1');
    assert.equal(raffleAccount2.name, 'Raffle 2');
  });

  it('Buy ticket', async () => {
    const raffle = anchor.web3.Keypair.generate();
    const entrants = anchor.web3.Keypair.generate();

    raffleEx = raffle.publicKey;

    await program.rpc.createRaffle(
      'Raffle-to-buy',
      'url.com',
      new BN(1),
      new BN(25),
      new BN(todayTimestamp),
      new BN(todayPlus5DaysTimeStamp),
      new BN(20),
      new BN(2),
      {
        accounts: {
          bank: bank.publicKey,
          raffle: raffle.publicKey,
          entrants: entrants.publicKey,
          tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        instructions: [
          await program.account.entrants.createInstruction(entrants),
        ],
        signers: [payer, raffle, entrants],
      }
    );

    const [ticketPDA, _] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode('tickets'),
        raffle.publicKey.toBuffer(),
        payer.publicKey.toBuffer(),
      ],
      program.programId
    );

    console.log({
      raffle: raffle.publicKey.toBase58(),
      ticketPDA: ticketPDA.toBase58(),
      bank: bank.publicKey.toBase58(),
      entrantsPDA: entrants.publicKey.toBase58(),
    });

    await program.rpc.buyTickets(new BN(1), {
      accounts: {
        bank: bank.publicKey,
        entrants: entrants.publicKey,
        bankBox: bankAcc,
        raffle: raffle.publicKey,
        tickets: ticketPDA,
        tokenAccount: tokenAcc,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [payer],
    });

    const tickets = await program.account.tickets.fetch(ticketPDA);

    console.log({
      ticketsAmount: tickets.amount,
    });

    console.log(
      'receiver token balance: ',
      await program.provider.connection.getTokenAccountBalance(bankAcc)
    );

    await program.rpc.buyTickets(new BN(5), {
      accounts: {
        bank: bank.publicKey,
        bankBox: bankAcc,
        raffle: raffle.publicKey,
        entrants: entrants.publicKey,
        tickets: ticketPDA,
        tokenAccount: tokenAcc,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [payer],
    });

    const ticketsRefetch = await program.account.tickets.fetch(ticketPDA);
    const entrantsAccount = await program.account.entrants.fetch(
      entrants.publicKey
    );

    console.log(
      'receiver token balance: ',
      await program.provider.connection.getTokenAccountBalance(bankAcc)
    );

    console.log({
      entrantsAccount0: entrantsAccount.entries[0].toBase58(),
    });

    assert.equal(tickets.amount, 1);
    assert.equal(ticketsRefetch.amount, 6);
  });

  it('Buy ticket with wrong token', async () => {
    const raffle = anchor.web3.Keypair.generate();
    const entrants = anchor.web3.Keypair.generate();

    await program.rpc.createRaffle(
      'Raffle 3',
      'url.com',
      new BN(1),
      new BN(5),
      new BN(todayTimestamp),
      new BN(todayPlus5DaysTimeStamp),
      new BN(10),
      new BN(2),
      {
        accounts: {
          bank: bank.publicKey,
          entrants: entrants.publicKey,
          raffle: raffle.publicKey,
          tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        instructions: [
          await program.account.entrants.createInstruction(entrants),
        ],
        signers: [payer, raffle, entrants],
      }
    );

    const [ticketPDA, _] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode('tickets'),
        raffle.publicKey.toBuffer(),
        payer.publicKey.toBuffer(),
      ],
      program.programId
    );

    const tokenWrong = await creatMintToken(connection, payer);
    await fundATA(tokenWrong, payer, payer.publicKey, 10);

    const tokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenWrong.publicKey,
      payer.publicKey
    );

    try {
      await program.rpc.buyTickets(new BN(1), {
        accounts: {
          bank: bank.publicKey,
          bankBox: bankAcc,
          raffle: raffle.publicKey,
          entrants: entrants.publicKey,
          tickets: ticketPDA,
          tokenAccount,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [payer],
      });
    } catch ({ error }) {
      assert.equal(error.errorMessage, 'Invalid token account for this raffle');
    }
  });

  it.skip('List all tickets from an raffle', async () => {
    const raffleAccount = await program.account.raffle.fetch(raffleEx);

    // const tickets = await program.account.tickets.all(
    //   [{
    //     dataSize:
    //   }]
    // );

    console.log({
      raffleEx: raffleEx.toBase58(),
      // tickets,
    });
  });

  it('pick winner', async () => {
    const raffleAccount = await program.account.raffle.fetch(raffleEx);

    const { blockhash } = await connection.getLatestBlockhash('recent');

    const slotHashes = new anchor.web3.PublicKey(
      'SysvarS1otHashes111111111111111111111111111'
    );

    // 15772581530002002718

    // connection.onLogs('all', (log) => {
    //   console.log({
    //     log,
    //   });
    // });

    await program.rpc.pickWinners({
      accounts: {
        raffle: raffleEx,
        entrants: raffleAccount.entrants,
        systemProgram: SystemProgram.programId,
        payer: payer.publicKey,
        recentBlockhashes: slotHashes,
      },
      signers: [payer],
    });
  });
});
