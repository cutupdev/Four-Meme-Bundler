use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer, Transfer, TokenInterface};
use crate::states::RwaAsset;
use crate::events::OwnershipTransferred;
use crate::errors::RwaTokenizationError;
use crate::consts::AssetStatus;

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(
        seeds = [RwaAsset::SEEDS, asset.asset_id.as_ref()],
        bump,
        constraint = asset.is_tokenized @ RwaTokenizationError::AssetNotTokenized,
        constraint = asset.status == AssetStatus::Active @ RwaTokenizationError::InvalidAssetStatus,
        constraint = asset.status != AssetStatus::Frozen @ RwaTokenizationError::AssetFrozen
    )]
    pub asset: Box<Account<'info, RwaAsset>>,

    #[account(mut)]
    pub from: Signer<'info>,

    /// CHECK: Token account owner
    #[account(mut)]
    pub from_token_account: AccountInfo<'info>,

    /// CHECK: Token account owner
    #[account(mut)]
    pub to_token_account: AccountInfo<'info>,

    /// CHECK: Mint account
    pub mint: AccountInfo<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> TransferOwnership<'info> {
    pub fn process(&self, amount: u64) -> Result<()> {
        require!(
            amount > 0,
            RwaTokenizationError::InsufficientBalance
        );

        // Transfer tokens
        let cpi_accounts = Transfer {
            from: self.from_token_account.to_account_info(),
            to: self.to_token_account.to_account_info(),
            authority: self.from.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            cpi_accounts,
        );
        transfer(cpi_ctx, amount)?;

        // Emit event
        emit!(OwnershipTransferred {
            asset_id: self.asset.key(),
            from: self.from.key(),
            to: self.to_token_account.key(),
            amount,
        });

        Ok(())
    }
}

