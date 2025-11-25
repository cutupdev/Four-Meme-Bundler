use anchor_lang::prelude::*;
use crate::states::RwaAsset;
use crate::events::AssetMetadataUpdated;
use crate::errors::RwaTokenizationError;
use crate::utils::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct UpdateAssetMetadataArgs {
    pub name: Option<String>,
    pub description: Option<String>,
    pub uri: Option<String>,
}

#[derive(Accounts)]
pub struct UpdateAssetMetadata<'info> {
    #[account(
        mut,
        seeds = [RwaAsset::SEEDS, asset.asset_id.as_ref()],
        bump,
        constraint = asset.owner == owner.key() @ RwaTokenizationError::Unauthorized
    )]
    pub asset: Box<Account<'info, RwaAsset>>,

    pub owner: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> UpdateAssetMetadata<'info> {
    pub fn process(&mut self, args: UpdateAssetMetadataArgs) -> Result<()> {
        // Validate new metadata if provided
        if let Some(ref name) = args.name {
            validate_name(name)?;
        }
        if let Some(ref description) = args.description {
            validate_description(description)?;
        }
        if let Some(ref uri) = args.uri {
            validate_uri(uri)?;
        }

        // Update metadata
        self.asset.update_metadata(
            args.name,
            args.description,
            args.uri,
        )?;

        // Emit event
        emit!(AssetMetadataUpdated {
            asset_id: self.asset.key(),
            updated_at: self.clock.unix_timestamp,
        });

        Ok(())
    }
}

