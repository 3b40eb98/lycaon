use anchor_lang::prelude::*;
use anchor_lang::solana_program::{clock, program_option::COption, sysvar};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod raffle {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn init_bank(ctx: Context<InitBank>) -> Result<()> {
        let bank = &mut ctx.accounts.bank;

        bank.bank_manager = ctx.accounts.bank_manager.key();
        bank.raffles_count = 0;

        msg!("bank initialized");
        Ok(())
    }

    pub fn create_raffle(
        ctx: Context<CreateRaffle>,
        raffle_name: String,
        raffle_thumbnail: String,
        max_entries_per_wallet: i32,
        start_date_timestamps: i64,
        end_date_timestamps: i64,
        raffle_price: u64,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let bank = &mut ctx.accounts.bank;

        bank.raffles_count += 1;

        raffle.name = raffle_name;
        raffle.raffle_manager = ctx.accounts.payer.key();
        raffle.raffle_thumbnail = raffle_thumbnail;
        raffle.max_entries_per_wallet = max_entries_per_wallet;
        raffle.start_date_timestamps = start_date_timestamps;
        raffle.end_date_timestamps = end_date_timestamps;
        raffle.token_mint = ctx.accounts.token_mint.key();
        raffle.bank = bank.key();
        raffle.raffle_price = raffle_price;
        raffle.bump = *ctx.bumps.get("raffle").unwrap();

        Ok(())
    }

    pub fn buy_tickets(ctx: Context<BuyTickets>, amount: u64) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let tickets = &mut ctx.accounts.tickets;
        let token = &mut ctx.accounts.token_account;

        // Transfer tokens into the bank
        {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.token_account.to_account_info(),
                    to: ctx.accounts.bank.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            );
            token::transfer(cpi_ctx, amount)?;
        }
        tickets.bump = *ctx.bumps.get("tickets").unwrap();
        // let _ = *ctx.bumps.get("token_to_raffle").unwrap();
        tickets.amount = amount;

        msg!(
            "gl you bought: {} tickets for the raffle: {}",
            amount,
            raffle.name
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct InitBank<'info> {
    // bank
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Bank>())]
    pub bank: Box<Account<'info, Bank>>,
    pub bank_manager: Signer<'info>,

    // misc
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[repr(C)]
#[account]
pub struct Bank {
    bank_manager: Pubkey,
    // total raffles registered with this bank
    raffles_count: u64,
}

#[derive(Accounts)]
pub struct CreateRaffle<'info> {
    #[account(mut)]
    pub bank: Box<Account<'info, Bank>>,

    #[account(init_if_needed, seeds = [
            b"raffle".as_ref(),
            bank.key().as_ref(),
            payer.key().as_ref(),
        ],
        bump,
        payer = payer,
        space = 8 + std::mem::size_of::<Raffle>())]
    pub raffle: Account<'info, Raffle>,

    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Raffle {
    pub name: String,
    pub raffle_thumbnail: String,
    // manager to control raffle, update, pick winner and end before timestamps
    pub raffle_manager: Pubkey,
    pub raffle_price: u64,

    pub max_entries_per_wallet: i32,

    pub bank: Pubkey,

    pub bump: u8,

    pub token_mint: Pubkey,
    pub start_date_timestamps: i64,
    pub end_date_timestamps: i64,
}

#[derive(Accounts)]
pub struct BuyTickets<'info> {
    #[account(mut)]
    pub raffle: Box<Account<'info, Raffle>>,

    // bank
    #[account(mut)]
    pub bank: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init, seeds = [
        b"tickets".as_ref(),
        raffle.key().as_ref(),
        payer.key().as_ref(),
    ],
    bump,
    payer = payer,
    space = 8 + std::mem::size_of::<Tickets>())]
    pub tickets: Account<'info, Tickets>,

    // the token account of the user
    // #[account(mut, seeds = [
    //     b"token_to_raffle".as_ref(),
    //     raffle.key().as_ref(),
    //     tickets.key().as_ref(),
    // ],
    // bump)]
    pub token_account: Box<Account<'info, TokenAccount>>,

    // Misc.
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Tickets {
    amount: u64,
    bump: u8,
}
