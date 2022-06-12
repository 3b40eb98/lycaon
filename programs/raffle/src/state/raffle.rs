use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
  #[msg("No tickets available for this raffle")]
  NoTicketsAvailable,
}

#[account(zero_copy)]
pub struct Entrants {
  pub total_entrants: u32,
  pub max_entrants: u32,
  pub entrants: [Pubkey; 6], // check how to define size dynamically
}

impl Entrants {
  pub fn append(&mut self, entrant: Pubkey) -> Result<()> {
    if self.total_entrants >= self.max_entrants {
      return Err(error!(ErrorCode::NoTicketsAvailable));
    }
    self.entrants[self.total_entrants as usize] = entrant;
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
  pub raffle_price: u64,

  pub max_entries_per_wallet: i32,

  pub entrants: Pubkey,

  pub bank: Pubkey,

  pub winners: Vec<Pubkey>,
  pub max_winners: i32,

  pub token_mint: Pubkey,
  pub start_date_timestamps: i64,
  pub end_date_timestamps: i64,
}
