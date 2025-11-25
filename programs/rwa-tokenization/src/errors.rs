use anchor_lang::prelude::*;

#[error_code]
pub enum RwaTokenizationError {
    #[msg("Asset is not registered")]
    AssetNotRegistered,

    #[msg("Asset is already tokenized")]
    AssetAlreadyTokenized,

    #[msg("Asset is not tokenized yet")]
    AssetNotTokenized,

    #[msg("Unauthorized: Only asset owner can perform this action")]
    Unauthorized,

    #[msg("Insufficient balance for this operation")]
    InsufficientBalance,

    #[msg("Invalid asset status for this operation")]
    InvalidAssetStatus,

    #[msg("Asset metadata is invalid")]
    InvalidMetadata,

    #[msg("Total supply must be greater than zero")]
    InvalidTotalSupply,

    #[msg("Asset is frozen and cannot be transferred")]
    AssetFrozen,

    #[msg("Asset is liquidated")]
    AssetLiquidated,

    #[msg("Configuration already initialized")]
    AlreadyInitialized,

    #[msg("Invalid configuration parameters")]
    InvalidConfiguration,

    #[msg("Asset verification failed")]
    VerificationFailed,

    #[msg("Slippage exceeded")]
    SlippageExceeded,

    #[msg("Asset registration fee not paid")]
    RegistrationFeeNotPaid,
}

