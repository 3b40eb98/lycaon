use anchor_lang::prelude::*;
use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod instructions;
pub mod state;

#[program]
pub mod raffle {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn init_bank(ctx: Context<InitBank>) -> Result<()> {
        instructions::init_bank::handler(ctx)
    }

    pub fn init_vault(ctx: Context<InitVault>) -> Result<()> {
        instructions::init_vault::handler(ctx)
    }

    pub fn create_raffle(
        ctx: Context<CreateRaffle>,
        bump_authority: u8,
        raffle_name: String,
        raffle_thumbnail: String,
        max_entries_per_wallet: u32,
        max_entrants: u32,
        start_date_timestamps: i64,
        end_date_timestamps: i64,
        raffle_price: f32,
        total_winners: u32,
    ) -> Result<()> {
        instructions::create_raffle::handler(
            ctx,
            bump_authority,
            raffle_name,
            raffle_thumbnail,
            max_entries_per_wallet,
            max_entrants,
            start_date_timestamps,
            end_date_timestamps,
            raffle_price,
            total_winners,
        )
    }

    pub fn buy_tickets(ctx: Context<BuyTickets>, amount: u32) -> Result<()> {
        instructions::buy_tickets::handler(ctx, amount)
    }
    pub fn pick_winners(ctx: Context<PickWinner>) -> Result<()> {
        instructions::pick_winners::handler(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
