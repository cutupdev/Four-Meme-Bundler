use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;
use crate::states::RwaAsset;
use crate::events::OwnershipVerified;
use crate::errors::RwaTokenizationError;

#[derive(Accounts)]
pub struct VerifyOwnership<'info> {
    #[account(
        seeds = [RwaAsset::SEEDS, asset.asset_id.as_ref()],
        bump,
        constraint = asset.is_tokenized @ RwaTokenizationError::AssetNotTokenized
    )]
    pub asset: Box<Account<'info, RwaAsset>>,

    /// CHECK: Token account to verify
    #[account(mut)]
    pub token_account: AccountInfo<'info>,

    /// CHECK: Owner to verify
    pub owner: AccountInfo<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> VerifyOwnership<'info> {
    pub fn process(&self) -> Result<()> {
        // In a real implementation, you would check the token account balance
        // For now, we'll just emit an event
        // The actual verification would require deserializing the token account
        
        let balance = 0u64; // Placeholder - would need to deserialize token account
        
        emit!(OwnershipVerified {
            asset_id: self.asset.key(),
            owner: self.owner.key(),
            balance,
            verified_at: self.clock.unix_timestamp,
        });

        Ok(())
    }
}

