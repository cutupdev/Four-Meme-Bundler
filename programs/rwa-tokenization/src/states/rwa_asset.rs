use anchor_lang::prelude::*;
use crate::consts::*;

#[account]
#[derive(Debug)]
pub struct RwaAsset {
    pub asset_id: Pubkey,
    pub owner: Pubkey,
    pub asset_type: AssetType,
    pub status: AssetStatus,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub uri: String,
    pub valuation: u64, // Asset valuation in lamports
    pub registered_at: i64,
    pub tokenized_at: Option<i64>,
    pub mint: Option<Pubkey>, // Token mint address if tokenized
    pub is_tokenized: bool,
}

impl RwaAsset {
    pub const SEEDS: &'static [u8] = ASSET_SEED;
    pub const BASE_SIZE: usize = 8 + // discriminator
        32 + // asset_id
        32 + // owner
        1 +  // asset_type
        1 +  // status
        4 +  // name (String length prefix)
        4 +  // symbol (String length prefix)
        4 +  // description (String length prefix)
        4 +  // uri (String length prefix)
        8 +  // valuation
        8 +  // registered_at
        9 +  // tokenized_at (Option<i64>)
        33 + // mint (Option<Pubkey>)
        1;   // is_tokenized

    pub fn init(
        &mut self,
        asset_id: Pubkey,
        owner: Pubkey,
        asset_type: AssetType,
        name: String,
        symbol: String,
        description: String,
        uri: String,
        valuation: u64,
        clock: &Clock,
    ) -> Result<()> {
        require!(
            name.len() <= MAX_NAME_LENGTH,
            crate::errors::RwaTokenizationError::InvalidMetadata
        );
        require!(
            symbol.len() <= MAX_SYMBOL_LENGTH,
            crate::errors::RwaTokenizationError::InvalidMetadata
        );
        require!(
            description.len() <= MAX_DESCRIPTION_LENGTH,
            crate::errors::RwaTokenizationError::InvalidMetadata
        );
        require!(
            uri.len() <= MAX_URI_LENGTH,
            crate::errors::RwaTokenizationError::InvalidMetadata
        );

        self.asset_id = asset_id;
        self.owner = owner;
        self.asset_type = asset_type;
        self.status = AssetStatus::Registered;
        self.name = name;
        self.symbol = symbol;
        self.description = description;
        self.uri = uri;
        self.valuation = valuation;
        self.registered_at = clock.unix_timestamp;
        self.tokenized_at = None;
        self.mint = None;
        self.is_tokenized = false;

        Ok(())
    }

    pub fn tokenize(&mut self, mint: Pubkey, clock: &Clock) -> Result<()> {
        require!(
            !self.is_tokenized,
            crate::errors::RwaTokenizationError::AssetAlreadyTokenized
        );
        require!(
            self.status == AssetStatus::Registered,
            crate::errors::RwaTokenizationError::InvalidAssetStatus
        );

        self.is_tokenized = true;
        self.mint = Some(mint);
        self.tokenized_at = Some(clock.unix_timestamp);
        self.status = AssetStatus::Active;

        Ok(())
    }

    pub fn update_status(&mut self, status: AssetStatus) -> Result<()> {
        self.status = status;
        Ok(())
    }

    pub fn update_metadata(
        &mut self,
        name: Option<String>,
        description: Option<String>,
        uri: Option<String>,
    ) -> Result<()> {
        if let Some(n) = name {
            require!(
                n.len() <= MAX_NAME_LENGTH,
                crate::errors::RwaTokenizationError::InvalidMetadata
            );
            self.name = n;
        }

        if let Some(d) = description {
            require!(
                d.len() <= MAX_DESCRIPTION_LENGTH,
                crate::errors::RwaTokenizationError::InvalidMetadata
            );
            self.description = d;
        }

        if let Some(u) = uri {
            require!(
                u.len() <= MAX_URI_LENGTH,
                crate::errors::RwaTokenizationError::InvalidMetadata
            );
            self.uri = u;
        }

        Ok(())
    }
}

