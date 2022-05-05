use anchor_lang::prelude::*;

#[repr(C)]
#[account]
pub struct Bank {
  pub bank_manager: Pubkey,
  // total raffles registered with this bank
  pub raffles_count: u64,
}
