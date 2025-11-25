use anchor_lang::prelude::*;
use crate::consts::*;

pub fn validate_uri(uri: &str) -> Result<()> {
    require!(
        uri.len() <= MAX_URI_LENGTH,
        crate::errors::RwaTokenizationError::InvalidMetadata
    );
    require!(
        !uri.is_empty(),
        crate::errors::RwaTokenizationError::InvalidMetadata
    );
    Ok(())
}

pub fn validate_name(name: &str) -> Result<()> {
    require!(
        name.len() <= MAX_NAME_LENGTH,
        crate::errors::RwaTokenizationError::InvalidMetadata
    );
    require!(
        !name.is_empty(),
        crate::errors::RwaTokenizationError::InvalidMetadata
    );
    Ok(())
}

pub fn validate_symbol(symbol: &str) -> Result<()> {
    require!(
        symbol.len() <= MAX_SYMBOL_LENGTH,
        crate::errors::RwaTokenizationError::InvalidMetadata
    );
    require!(
        !symbol.is_empty(),
        crate::errors::RwaTokenizationError::InvalidMetadata
    );
    Ok(())
}

pub fn validate_description(description: &str) -> Result<()> {
    require!(
        description.len() <= MAX_DESCRIPTION_LENGTH,
        crate::errors::RwaTokenizationError::InvalidMetadata
    );
    Ok(())
}

pub fn validate_valuation(valuation: u64) -> Result<()> {
    require!(
        valuation > 0,
        crate::errors::RwaTokenizationError::InvalidConfiguration
    );
    Ok(())
}

