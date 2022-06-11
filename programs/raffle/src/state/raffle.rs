use anchor_lang::prelude::*;

#[account]
pub struct Raffle {
  pub name: String,
  pub raffle_thumbnail: String,
  // manager to control raffle, update, pick winner and end before timestamps
  pub raffle_manager: Pubkey,
  pub raffle_price: u64,

  pub max_entrants: i32,
  pub max_entries_per_wallet: i32,

  pub bank: Pubkey,

  pub winners: Vec<Pubkey>,
  pub max_winners: i32,

  pub token_mint: Pubkey,
  pub start_date_timestamps: i64,
  pub end_date_timestamps: i64,
}
