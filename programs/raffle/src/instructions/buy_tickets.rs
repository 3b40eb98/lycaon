use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;

impl<'info> BuyTickets<'info> {
  fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
    CpiContext::new(
      self.token_program.to_account_info(),
      Transfer {
        from: self.token_account.to_account_info(),
        to: self.bank_box.to_account_info(),
        authority: self.payer.to_account_info(),
      },
    )
  }
}

pub fn handler(ctx: Context<BuyTickets>, amount: u32) -> Result<()> {
  let payer = ctx.accounts.payer.key();
  let raffle = &mut ctx.accounts.raffle;
  let tickets = &mut ctx.accounts.tickets;
  let price = amount * raffle.raffle_price as u32;
  let mut entrants = ctx.accounts.entrants.load_mut()?;

  tickets.bump = *ctx.bumps.get("tickets").unwrap();

  tickets.amount = if tickets.amount > 0 {
    tickets.amount + amount
  } else {
    amount
  };
  tickets.raffle = raffle.key();

  for _x in 0..amount {
    entrants.append(payer)?;
  }

  msg!(
    "gl in the raffle. You have bought {} tickets for {}",
    amount,
    raffle.name
  );

  token::transfer(ctx.accounts.transfer_ctx(), price.into())?;

  Ok(())
}

#[error_code]
pub enum ErrorCode {
  #[msg("Invalid token account for this raffle")]
  InvalidTokenAccountProvided,
}

#[derive(Accounts)]
pub struct BuyTickets<'info> {
  #[account(mut, has_one = entrants, constraint = entrants.key() == raffle.entrants)]
  pub raffle: Box<Account<'info, Raffle>>,

  // bank
  #[account(mut)]
  pub bank: Box<Account<'info, Bank>>,

  #[account(mut)]
  pub entrants: AccountLoader<'info, Entrants>,

  #[account(mut)]
  pub payer: Signer<'info>,

  // this make senses?
  #[account(init_if_needed, seeds = [
        b"tickets".as_ref(),
        raffle.key().as_ref(),
        payer.key().as_ref(),
    ],
    bump,
    payer = payer,
    space = 8 + std::mem::size_of::<Tickets>())]
  pub tickets: Account<'info, Tickets>,

  #[account(mut)]
  pub bank_box: Box<Account<'info, TokenAccount>>,

  #[account(mut, constraint = token_account.mint == raffle.receive_token_account @ ErrorCode::InvalidTokenAccountProvided)]
  pub token_account: Box<Account<'info, TokenAccount>>,

  // Misc.
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}
