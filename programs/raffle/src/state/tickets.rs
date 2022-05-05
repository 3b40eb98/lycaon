use anchor_lang::prelude::*;

#[account]
pub struct Tickets {
  pub amount: u64,
  pub bump: u8,
}
