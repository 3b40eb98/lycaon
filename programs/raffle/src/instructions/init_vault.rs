use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, SetAuthority, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType;

use crate::state::*;

// impl<'info> InitVault<'info> {
//   fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//     let cpi_accounts = Transfer {
//       from: self
//         .initializer_deposit_token_account
//         .to_account_info()
//         .clone(),
//       to: self.vault_account.to_account_info().clone(),
//       authority: self.initializer.clone(),
//     };
//     CpiContext::new(self.token_program.clone(), cpi_accounts)
//   }

//   fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
//     let cpi_accounts = SetAuthority {
//       account_or_mint: self.vault_account.to_account_info().clone(),
//       current_authority: self.initializer.clone(),
//     };
//     CpiContext::new(self.token_program.clone(), cpi_accounts)
//   }
// }

pub fn handler(ctx: Context<InitVault>) -> Result<()> {
  let vault = &mut ctx.accounts.vault;
  let payer_addr = ctx.accounts.payer.key();

  let seeds = &[VAULT_PDA_SEED, payer_addr.as_ref()];

  let (vault_authority, vault_authority_bump) = Pubkey::find_program_address(seeds, ctx.program_id);

  vault.creator = payer_addr;
  vault.authority = vault_authority;
  vault.authority_seed = payer_addr;
  vault.authority_bump_seed = [vault_authority_bump];

  // token::set_authority(
  //   ctx.accounts.into_set_authority_context(),
  //   AuthorityType::AccountOwner,
  //   Some(vault_authority),
  // )?;

  Ok(())
}

#[derive(Accounts)]
pub struct InitVault<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
    init,
    seeds = [b"vault-account".as_ref(), payer.key().as_ref()],
    bump,
    payer = payer,
    space = 8 + std::mem::size_of::<Vault>())]
  pub vault: Account<'info, Vault>,

  pub system_program: Program<'info, System>,
}
