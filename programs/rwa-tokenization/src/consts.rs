use anchor_lang::prelude::*;

/// Seed for the global configuration PDA
pub const GLOBAL_CONFIG_SEED: &[u8] = b"rwa_global_config";

/// Seed for asset PDA
pub const ASSET_SEED: &[u8] = b"rwa_asset";

/// Seed for tokenization PDA
pub const TOKENIZATION_SEED: &[u8] = b"rwa_tokenization";

/// Default token decimals
pub const DEFAULT_DECIMALS: u8 = 9;

/// Maximum metadata URI length
pub const MAX_URI_LENGTH: usize = 200;

/// Maximum asset name length
pub const MAX_NAME_LENGTH: usize = 100;

/// Maximum asset symbol length
pub const MAX_SYMBOL_LENGTH: usize = 10;

/// Maximum asset description length
pub const MAX_DESCRIPTION_LENGTH: usize = 500;

/// Default registration fee in lamports
pub const DEFAULT_REGISTRATION_FEE: u64 = 1_000_000_000; // 1 SOL

/// Default tokenization fee in lamports
pub const DEFAULT_TOKENIZATION_FEE: u64 = 2_000_000_000; // 2 SOL

/// Asset status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum AssetStatus {
    /// Asset is registered but not yet tokenized
    Registered,
    /// Asset is tokenized and active
    Active,
    /// Asset transfers are frozen
    Frozen,
    /// Asset has been liquidated
    Liquidated,
    /// Asset has been redeemed
    Redeemed,
}

impl Default for AssetStatus {
    fn default() -> Self {
        AssetStatus::Registered
    }
}

/// Asset type enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum AssetType {
    /// Real estate property
    RealEstate,
    /// Commodity (gold, silver, etc.)
    Commodity,
    /// Artwork or collectible
    Artwork,
    /// Intellectual property
    IntellectualProperty,
    /// Business equity
    BusinessEquity,
    /// Other asset type
    Other,
}

impl Default for AssetType {
    fn default() -> Self {
        AssetType::Other
    }
}

