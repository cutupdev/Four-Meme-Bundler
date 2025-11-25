use anchor_lang::prelude::*;
use anchor_spl::token_interface::{burn, Burn, TokenInterface};
use crate::states::{RwaAsset, Tokenization};
use crate::consts::{TOKENIZATION_SEED, AssetStatus};
use crate::events::AssetRedeemed;
use crate::errors::RwaTokenizationError;

#[derive(Accounts)]
pub struct RedeemAsset<'info> {
    #[account(
        mut,
        seeds = [RwaAsset::SEEDS, asset.asset_id.as_ref()],
        bump,
        constraint = asset.is_tokenized @ RwaTokenizationError::AssetNotTokenized
    )]
    pub asset: Box<Account<'info, RwaAsset>>,

    #[account(
        seeds = [TOKENIZATION_SEED, asset.key().as_ref()],
        bump
    )]
    pub tokenization: Box<Account<'info, Tokenization>>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Token account
    #[account(mut)]
    pub owner_token_account: AccountInfo<'info>,

    /// CHECK: Mint account
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> RedeemAsset<'info> {
    pub fn process(&mut self, amount: u64) -> Result<()> {
        require!(
            amount > 0,
            RwaTokenizationError::InsufficientBalance
        );

        // Burn tokens
        let cpi_accounts = Burn {
            mint: self.mint.to_account_info(),
            from: self.owner_token_account.to_account_info(),
            authority: self.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            cpi_accounts,
        );
        burn(cpi_ctx, amount)?;

        // Update asset status if all tokens are burned
        // Note: In a full implementation, you'd check the total supply
        
        // Emit event
        emit!(AssetRedeemed {
            asset_id: self.asset.key(),
            mint: self.mint.key(),
            amount,
            redeemed_at: self.clock.unix_timestamp,
        });

        Ok(())
    }
}

