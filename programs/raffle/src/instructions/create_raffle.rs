use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::*;

pub fn handler(
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
