use anchor_lang::prelude::*;

use crate::state::*;

pub fn handler(ctx: Context<PickWinner>) -> Result<()> {
  let raffle = &mut ctx.accounts.raffle;
  let entrants = ctx.accounts.entrants.load_mut()?;

  let recent_blockhashes = &ctx.accounts.recent_blockhashes;

  let total_winners = raffle.max_winners;
  let total_entrants = entrants.total_entrants;
  let entrantsss = entrants.entrants;

  let random = u64::from_le_bytes(
    recent_blockhashes.to_account_info().data.borrow()[16..24]
      .try_into()
      .unwrap(),
  );

  let winner_index = random % entrants.total_entrants;

  msg!(
    "Number random {}, winner: {}, total_entrants: {}",
    random,
    winner_index,
    entrants.total_entrants
  );

  // let winner = entrantsss[random];

  // raffle.winners.push(winner);

  Ok(())
}

#[derive(Accounts)]
pub struct PickWinner<'info> {
  // raffle
  #[account(mut, has_one = entrants)]
  pub raffle: Box<Account<'info, Raffle>>,
  #[account(mut)]
  pub entrants: AccountLoader<'info, Entrants>,
  /// CHECK:
  pub recent_blockhashes: UncheckedAccount<'info>,

  // misc
  #[account(mut)]
  pub payer: Signer<'info>,
  pub system_program: Program<'info, System>,
}
