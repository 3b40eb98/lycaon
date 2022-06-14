use anchor_lang::prelude::*;

use crate::state::*;

pub fn handler(ctx: Context<PickWinner>) -> Result<()> {
  let raffle = &mut ctx.accounts.raffle;
  let mut entrants = ctx.accounts.entrants.load_mut()?;

  let recent_blockhashes = &ctx.accounts.recent_blockhashes;

  let total_winners = raffle.max_winners;
  let total_entrants = entrants.total_entrants;

  // let tickets = Pubkey::find_program_address(seeds: &[&[u8]], program_id: &Pubkey)

  msg!("bank initialized");
  Ok(())
}

#[derive(Accounts)]
pub struct PickWinner<'info> {
  // raffle
  #[account(mut, has_one = entrants)]
  pub raffle: Box<Account<'info, Raffle>>,

  pub entrants: AccountLoader<'info, Entrants>,

  pub recent_blockhashes: UncheckedAccount<'info>,

  // misc
  #[account(mut)]
  pub payer: Signer<'info>,
  pub system_program: Program<'info, System>,
}
