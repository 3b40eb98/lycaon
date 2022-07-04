use anchor_lang::prelude::*;

pub const MAX_ENTRANTS: u32 = 1000;
pub const RAFFLE_ESCROW_PDA_SEED: &[u8] = b"raffle-escrow";

#[error_code]
pub enum RaffleErrorCode {
  #[msg("No tickets available for this raffle")]
  NoTicketsAvailable,
  #[msg("The number of entries is too large")]
  MaxEntrantsTooLarge,
  #[msg("End time cannot be a past date")]
  NoPastEndTime,
  #[msg("Start time cannot be a past date")]
  NoPastStartTime,
  #[msg("The total winners cannot exceed the number of entries")]
  TotalWinnerExceedTotalEntrants,
  #[msg("Total winners has already been picked")]
  WinnersAlreadyPicked,
  #[msg("Only the raffle_manager of this raffle can pick a winner")]
  OnlyRaffleManagerCanPickWinner,
}

#[account]
pub struct Raffle {
  pub name: String,
  // manager to control raffle, update, pick winner and end before timestamps
  pub raffle_manager: Pubkey,
  pub raffle_price: f32,

  pub max_entries_per_wallet: u32,

  pub entrants: Pubkey,

  pub vault: Pubkey,

  pub winners: Vec<Pubkey>,
  pub total_winners: u32,

  pub prize_token_mint: Pubkey,
  pub prize_token_account: Pubkey,
  pub spl_token_mint: Pubkey,
  pub start_date_timestamps: i64,
  pub end_date_timestamps: i64,
}
