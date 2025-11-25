use anchor_lang::prelude::*;

pub mod consts;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod states;
pub mod utils;

use crate::instructions::*;

declare_id!("RWA1111111111111111111111111111111111111111");

#[program]
pub mod rwa_tokenization {

    use super::*;

    /// Initialize the global RWA tokenization configuration
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        ctx.accounts.process(params)
    }

    /// Register a new real-world asset
    pub fn register_asset(ctx: Context<RegisterAsset>, args: RegisterAssetArgs) -> Result<()> {
        ctx.accounts.process(args)
    }

    /// Tokenize a registered asset (mint tokens representing ownership)
    pub fn tokenize_asset(ctx: Context<TokenizeAsset>, total_supply: u64) -> Result<()> {
        ctx.accounts.process(total_supply)
    }

    /// Transfer tokenized asset ownership
    pub fn transfer_ownership(
        ctx: Context<TransferOwnership>,
        amount: u64,
    ) -> Result<()> {
        ctx.accounts.process(amount)
    }

    /// Update asset metadata (only by asset owner)
    pub fn update_asset_metadata(
        ctx: Context<UpdateAssetMetadata>,
        args: UpdateAssetMetadataArgs,
    ) -> Result<()> {
        ctx.accounts.process(args)
    }

    /// Verify asset ownership
    pub fn verify_ownership(ctx: Context<VerifyOwnership>) -> Result<()> {
        ctx.accounts.process()
    }

    /// Burn tokens (redeem tokenized asset)
    pub fn redeem_asset(ctx: Context<RedeemAsset>, amount: u64) -> Result<()> {
        ctx.accounts.process(amount)
    }

    /// Set asset status (active, frozen, liquidated, etc.)
    pub fn set_asset_status(
        ctx: Context<SetAssetStatus>,
        status: AssetStatus,
    ) -> Result<()> {
        ctx.accounts.process(status)
    }
}

