use anchor_lang::prelude::*;
use crate::states::RwaAsset;
use crate::consts::AssetStatus;
use crate::events::AssetStatusChanged;
use crate::errors::RwaTokenizationError;

#[derive(Accounts)]
pub struct SetAssetStatus<'info> {
    #[account(
        mut,
        seeds = [RwaAsset::SEEDS, asset.asset_id.as_ref()],
        bump,
        constraint = asset.owner == owner.key() @ RwaTokenizationError::Unauthorized
    )]
    pub asset: Box<Account<'info, RwaAsset>>,

    pub owner: Signer<'info>,
}

impl<'info> SetAssetStatus<'info> {
    pub fn process(&mut self, status: AssetStatus) -> Result<()> {
        let old_status = self.asset.status;
        
        // Validate status transition
        match (old_status, status) {
            (AssetStatus::Liquidated, _) => {
                return Err(RwaTokenizationError::InvalidAssetStatus.into());
            }
            (AssetStatus::Redeemed, _) => {
                return Err(RwaTokenizationError::InvalidAssetStatus.into());
            }
            _ => {}
        }

        // Update status
        self.asset.update_status(status)?;

        // Emit event
        emit!(AssetStatusChanged {
            asset_id: self.asset.key(),
            old_status,
            new_status: status,
        });

        Ok(())
    }
}

