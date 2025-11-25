use anchor_lang::prelude::*;
use crate::consts::*;

#[account]
#[derive(Debug)]
pub struct GlobalConfig {
    pub authority: Pubkey,
    pub registration_fee: u64,
    pub tokenization_fee: u64,
    pub platform_fee_bps: u16, // Basis points (10000 = 100%)
    pub is_initialized: bool,
    pub total_assets: u64,
    pub total_tokenized_assets: u64,
}

impl GlobalConfig {
    pub const SEEDS: &'static [u8] = GLOBAL_CONFIG_SEED;
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        8 +  // registration_fee
        8 +  // tokenization_fee
        2 +  // platform_fee_bps
        1 +  // is_initialized
        8 +  // total_assets
        8;   // total_tokenized_assets

    pub fn init(
        &mut self,
        authority: Pubkey,
        registration_fee: u64,
        tokenization_fee: u64,
        platform_fee_bps: u16,
    ) -> Result<()> {
        require!(!self.is_initialized, crate::errors::RwaTokenizationError::AlreadyInitialized);
        require!(platform_fee_bps <= 10000, crate::errors::RwaTokenizationError::InvalidConfiguration);

        self.authority = authority;
        self.registration_fee = registration_fee;
        self.tokenization_fee = tokenization_fee;
        self.platform_fee_bps = platform_fee_bps;
        self.is_initialized = true;
        self.total_assets = 0;
        self.total_tokenized_assets = 0;

        Ok(())
    }

    pub fn increment_total_assets(&mut self) {
        self.total_assets = self.total_assets.checked_add(1).unwrap();
    }

    pub fn increment_total_tokenized_assets(&mut self) {
        self.total_tokenized_assets = self.total_tokenized_assets.checked_add(1).unwrap();
    }
}

