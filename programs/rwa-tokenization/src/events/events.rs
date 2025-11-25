use anchor_lang::prelude::*;
use crate::consts::{AssetStatus, AssetType};

#[event]
pub struct AssetRegistered {
    pub asset_id: Pubkey,
    pub owner: Pubkey,
    pub asset_type: AssetType,
    pub name: String,
    pub registered_at: i64,
}

#[event]
pub struct AssetTokenized {
    pub asset_id: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub tokenized_at: i64,
}

#[event]
pub struct OwnershipTransferred {
    pub asset_id: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AssetMetadataUpdated {
    pub asset_id: Pubkey,
    pub updated_at: i64,
}

#[event]
pub struct AssetStatusChanged {
    pub asset_id: Pubkey,
    pub old_status: AssetStatus,
    pub new_status: AssetStatus,
}

#[event]
pub struct AssetRedeemed {
    pub asset_id: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub redeemed_at: i64,
}

#[event]
pub struct OwnershipVerified {
    pub asset_id: Pubkey,
    pub owner: Pubkey,
    pub balance: u64,
    pub verified_at: i64,
}

