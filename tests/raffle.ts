import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Raffle } from "../target/types/raffle";
import { BN } from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import chai, { assert, expect } from "chai";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("raffle", () => {
  const provider = anchor.getProvider();

  anchor.setProvider(provider);

  const connection = provider.connection;

  const program = anchor.workspace.Raffle as Program<Raffle>;

  const payer = anchor.web3.Keypair.generate();
  const bank = anchor.web3.Keypair.generate();
  const mint = new PublicKey("C4VW9CKc8mPBMmJsqDpTF24TwYpbLW1aTzhRevMfWUXi");

  before("fund wallet", async () => {
    const bankFund = await program.provider.connection.requestAirdrop(
      bank.publicKey,
      1000000000
    );

    const payerFund = await program.provider.connection.requestAirdrop(
      payer.publicKey,
      1000000000
    );
    await program.provider.connection.confirmTransaction(bankFund);
    await program.provider.connection.confirmTransaction(payerFund);
  });

  let tokenMint: PublicKey;
  let bankAcc: PublicKey;

  before("create mint token", async () => {
    const token = await Token.createMint(
      connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      0,
      TOKEN_PROGRAM_ID
    );

    const token2 = await Token.createMint(
      connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      0,
      TOKEN_PROGRAM_ID
    );

    const account = await token.createAssociatedTokenAccount(payer.publicKey);
    bankAcc = await token.createAssociatedTokenAccount(bank.publicKey);
    await token.mintTo(account, payer, [], 10000);

    tokenMint = token.publicKey;

    console.log({
      tokenMint: token.publicKey.toBase58(),
      account: account.toBase58(),
      bankAcc: bankAcc.toBase58(),
    });
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });

  it("Create bank", async () => {
    console.log("bank address", bank.publicKey.toBase58());

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

  it("Create raffle", async () => {
    const raffle = anchor.web3.Keypair.generate();
    const raffle2 = anchor.web3.Keypair.generate();

    await program.rpc.createRaffle(
      "Raffle 1",
      "valid-Url_afert",
      new BN(1),
      new BN(1650605069),
      new BN(1650605069),
      new BN(20),
      {
        accounts: {
          bank: bank.publicKey,
          raffle: raffle.publicKey,
          tokenMint: tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers: [payer, raffle],
      }
    );

    await program.rpc.createRaffle(
      "Raffle 2",
      "valid-Url_afert",
      new BN(1),
      new BN(1650605069),
      new BN(1650605069),
      new BN(20),
      {
        accounts: {
          bank: bank.publicKey,
          raffle: raffle2.publicKey,
          tokenMint: tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers: [payer, raffle2],
      }
    );

    const raffleAccount = await program.account.raffle.fetch(raffle.publicKey);

    const raffleAccount2 = await program.account.raffle.fetch(
      raffle2.publicKey
    );

    assert.equal(raffleAccount.name, "Raffle 1");
    assert.equal(raffleAccount2.name, "Raffle 2");
  });

  it("Buy ticket", async () => {
    // if PDA exists so u should assume that pda already bought the tickets to raffle then just updated to the new one

    const raffle = anchor.web3.Keypair.generate();

    await program.rpc.createRaffle(
      "Raffle-to-buy",
      "valid-Url_afert",
      new BN(1),
      new BN(1650605069),
      new BN(1650605069),
      new BN(20),
      {
        accounts: {
          bank: bank.publicKey,
          raffle: raffle.publicKey,
          tokenMint: tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers: [payer, raffle],
      }
    );

    const [ticketPDA, _] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("tickets"),
        raffle.publicKey.toBuffer(),
        payer.publicKey.toBuffer(),
      ],
      program.programId
    );

    const tokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      payer.publicKey
    );

    console.log({
      raffle: raffle.publicKey.toBase58(),
      ticketPDA: ticketPDA.toBase58(),
      tokenAccount: tokenAccount.toBase58(),
      bank: bank.publicKey.toBase58(),
    });

    await program.rpc.buyTickets(new BN(1), {
      accounts: {
        bank: bank.publicKey,
        bankBox: bankAcc,
        raffle: raffle.publicKey,
        tickets: ticketPDA,
        tokenAccount: tokenAccount,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [payer],
    });

    const tickets = await program.account.tickets.fetch(ticketPDA);

    console.log({
      ticketsAmount: tickets.amount.toNumber(),
    });

    console.log(
      "receiver token balance: ",
      await program.provider.connection.getTokenAccountBalance(bankAcc)
    );

    await program.rpc.buyTickets(new BN(5), {
      accounts: {
        bank: bank.publicKey,
        bankBox: bankAcc,
        raffle: raffle.publicKey,
        tickets: ticketPDA,
        tokenAccount: tokenAccount,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [payer],
    });

    const ticketsRefetch = await program.account.tickets.fetch(ticketPDA);

    console.log({
      ticketsAmount: ticketsRefetch.amount.toNumber(),
    });

    console.log(
      "receiver token balance: ",
      await program.provider.connection.getTokenAccountBalance(bankAcc)
    );
  });

  it.skip("Buy ticket with wrong token", async () => {
    const [rafflePDA] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("raffle"),
        bank.publicKey.toBuffer(),
        payer.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.rpc.createRaffle(
      "Raffle 3",
      "valid-Url_afert",
      new BN(1),
      new BN(1650605069),
      new BN(1650605069),
      new BN(10),
      {
        accounts: {
          bank: bank.publicKey,
          raffle: rafflePDA,
          tokenMint: tokenMint,
          payer: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers: [payer],
      }
    );

    const raffleAccounts = await program.account.raffle.fetch(rafflePDA);

    console.log({
      raffleAccounts,
    });

    // const [ticketPDA, _] = await PublicKey.findProgramAddress(
    //   [
    //     anchor.utils.bytes.utf8.encode("tickets"),
    //     rafflePDA.toBuffer(),
    //     payer.publicKey.toBuffer(),
    //   ],
    //   program.programId
    // );

    // const tokenAccount = await Token.getAssociatedTokenAddress(
    //   ASSOCIATED_TOKEN_PROGRAM_ID,
    //   TOKEN_PROGRAM_ID,
    //   tokenMint2,
    //   payer.publicKey
    // );

    // try {
    //   await program.rpc.buyTickets(new BN(1), {
    //     accounts: {
    //       bank: bank.publicKey,
    //       bankBox: bankAcc2,
    //       raffle: rafflePDA,
    //       tickets: ticketPDA,
    //       tokenAccount: tokenAccount,
    //       payer: payer.publicKey,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       systemProgram: SystemProgram.programId,
    //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     },
    //     signers: [payer],
    //   });
    // } catch (error) {
    //   console.log({
    //     error,
    //   });
    //   // assert.equal(
    //   //   error.msg,
    //   //   "AnchorError caused by account: token_account. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated."
    //   // );
    //   return;
    // }
  });
});
