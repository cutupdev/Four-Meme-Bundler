use anchor_lang::prelude::*;
use crate::consts::*;

#[account]
#[derive(Debug)]
pub struct Tokenization {
    pub asset_id: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub tokenized_at: i64,
    pub tokenization_authority: Pubkey,
}

impl Tokenization {
    pub const SEEDS: &'static [u8] = TOKENIZATION_SEED;
    pub const SIZE: usize = 8 + // discriminator
        32 + // asset_id
        32 + // mint
        8 +  // total_supply
        8 +  // tokenized_at
        32;  // tokenization_authority

    pub fn init(
        &mut self,
        asset_id: Pubkey,
        mint: Pubkey,
        total_supply: u64,
        tokenization_authority: Pubkey,
        clock: &Clock,
    ) -> Result<()> {
        require!(
            total_supply > 0,
            crate::errors::RwaTokenizationError::InvalidTotalSupply
        );

        self.asset_id = asset_id;
        self.mint = mint;
        self.total_supply = total_supply;
        self.tokenized_at = clock.unix_timestamp;
        self.tokenization_authority = tokenization_authority;

        Ok(())
    }
}

