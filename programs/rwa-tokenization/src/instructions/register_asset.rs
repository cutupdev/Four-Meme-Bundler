use anchor_lang::prelude::*;
use crate::states::{GlobalConfig, RwaAsset};
use crate::consts::AssetType;
use crate::events::AssetRegistered;
use crate::errors::RwaTokenizationError;
use crate::utils::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RegisterAssetArgs {
    pub asset_type: AssetType,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub uri: String,
    pub valuation: u64,
}

#[derive(Accounts)]
pub struct RegisterAsset<'info> {
    #[account(
        seeds = [GlobalConfig::SEEDS],
        bump
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    /// CHECK: Asset ID provided by user (should be a unique identifier)
    pub asset_id: AccountInfo<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + RwaAsset::BASE_SIZE + 
            4 + 100 + // name (max 100)
            4 + 10 +  // symbol (max 10)
            4 + 500 + // description (max 500)
            4 + 200,  // uri (max 200)
        seeds = [RwaAsset::SEEDS, asset_id.key().as_ref()],
        bump
    )]
    pub asset: Box<Account<'info, RwaAsset>>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> RegisterAsset<'info> {
    pub fn process(&mut self, args: RegisterAssetArgs) -> Result<()> {
        // Validate metadata
        validate_name(&args.name)?;
        validate_symbol(&args.symbol)?;
        validate_description(&args.description)?;
        validate_uri(&args.uri)?;
        validate_valuation(args.valuation)?;

        // Check registration fee
        require!(
            self.owner.lamports() >= self.global_config.registration_fee,
            RwaTokenizationError::RegistrationFeeNotPaid
        );

        // Transfer registration fee
        **self.owner.to_account_info().try_borrow_mut_lamports()? -= self.global_config.registration_fee;
        **self.global_config.to_account_info().try_borrow_mut_lamports()? += self.global_config.registration_fee;

        // Initialize asset
        self.asset.init(
            self.asset_id.key(),
            self.owner.key(),
            args.asset_type,
            args.name.clone(),
            args.symbol.clone(),
            args.description.clone(),
            args.uri.clone(),
            args.valuation,
            &self.clock,
        )?;

        // Update global config
        self.global_config.increment_total_assets();

        // Emit event
        emit!(AssetRegistered {
            asset_id: self.asset.key(),
            owner: self.owner.key(),
            asset_type: args.asset_type,
            name: args.name,
            registered_at: self.clock.unix_timestamp,
        });

        Ok(())
    }
}

