use anchor_lang::prelude::*;

pub const MAX_ENTRANTS: u32 = 1000;

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
  #[msg("The total winners cannot exceed the number of participants")]
  TotalWinnerExceedTotalEntrants,
}
#[account(zero_copy)]
pub struct Entrants {
  pub total_entrants: u32,
  pub max_entrants: u32,
  pub entries: [Pubkey; 1000], // check how to define size dynamically
}

impl Entrants {
  pub fn append(&mut self, entrant: Pubkey) -> Result<()> {
    if self.total_entrants >= self.max_entrants {
      return Err(error!(RaffleErrorCode::NoTicketsAvailable));
    }
    self.entries[self.total_entrants as usize] = entrant;
    self.total_entrants += 1;
    Ok(())
  }
}

#[account]
pub struct Raffle {
  pub name: String,
  pub raffle_thumbnail: String,
  // manager to control raffle, update, pick winner and end before timestamps
  pub raffle_manager: Pubkey,
  pub raffle_price: f32,

  pub max_entries_per_wallet: u32,

  pub entrants: Pubkey,

  pub bank: Pubkey,

  pub winners: Vec<Pubkey>,
  pub total_winners: u32,

  pub token_mint: Pubkey,
  pub start_date_timestamps: i64,
  pub end_date_timestamps: i64,
}
