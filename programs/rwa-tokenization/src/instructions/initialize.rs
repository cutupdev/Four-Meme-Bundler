use anchor_lang::prelude::*;
use crate::states::GlobalConfig;
use crate::errors::RwaTokenizationError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct InitializeParams {
    pub registration_fee: u64,
    pub tokenization_fee: u64,
    pub platform_fee_bps: u16,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = GlobalConfig::SIZE,
        seeds = [GlobalConfig::SEEDS],
        bump
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn process(&self, params: InitializeParams) -> Result<()> {
        require!(
            params.platform_fee_bps <= 10000,
            RwaTokenizationError::InvalidConfiguration
        );

        self.global_config.init(
            self.authority.key(),
            params.registration_fee,
            params.tokenization_fee,
            params.platform_fee_bps,
        )?;

        Ok(())
    }
}

