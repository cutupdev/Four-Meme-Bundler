use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{
        self,
        spl_token_2022::{
            extension::{
                BaseStateWithExtensions, ExtensionType, StateWithExtensions,
            },
            state::Mint as MintState,
        },
        Token2022,
    },
    token_interface::{
        initialize_mint2, mint_to, InitializeMint2, MintTo, TokenInterface,
    },
};
use crate::states::{GlobalConfig, RwaAsset, Tokenization};
use crate::consts::{DEFAULT_DECIMALS, TOKENIZATION_SEED};
use crate::events::AssetTokenized;
use crate::errors::RwaTokenizationError;

#[derive(Accounts)]
pub struct TokenizeAsset<'info> {
    #[account(
        seeds = [GlobalConfig::SEEDS],
        bump
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,

    #[account(
        mut,
        seeds = [RwaAsset::SEEDS, asset.asset_id.as_ref()],
        bump,
        constraint = asset.owner == owner.key() @ RwaTokenizationError::Unauthorized,
        constraint = !asset.is_tokenized @ RwaTokenizationError::AssetAlreadyTokenized
    )]
    pub asset: Box<Account<'info, RwaAsset>>,

    #[account(
        init,
        payer = owner,
        mint::decimals = DEFAULT_DECIMALS,
        mint::authority = tokenization,
    )]
    pub mint: Box<InterfaceAccount<'info, MintState>>,

    #[account(
        init,
        payer = owner,
        space = Tokenization::SIZE,
        seeds = [TOKENIZATION_SEED, asset.key().as_ref()],
        bump
    )]
    pub tokenization: Box<Account<'info, Tokenization>>,

    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = owner,
    )]
    pub owner_token_account: Box<InterfaceAccount<'info, anchor_spl::token_interface::TokenAccount>>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> TokenizeAsset<'info> {
    pub fn process(&mut self, total_supply: u64) -> Result<()> {
        require!(
            total_supply > 0,
            RwaTokenizationError::InvalidTotalSupply
        );

        // Check tokenization fee
        require!(
            self.owner.lamports() >= self.global_config.tokenization_fee,
            RwaTokenizationError::RegistrationFeeNotPaid
        );

        // Transfer tokenization fee
        **self.owner.to_account_info().try_borrow_mut_lamports()? -= self.global_config.tokenization_fee;
        **self.global_config.to_account_info().try_borrow_mut_lamports()? += self.global_config.tokenization_fee;

        // Initialize tokenization record
        self.tokenization.init(
            self.asset.key(),
            self.mint.key(),
            total_supply,
            self.owner.key(),
            &self.clock,
        )?;

        // Mint tokens to owner
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.owner_token_account.to_account_info(),
            authority: self.tokenization.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            &[&[
                TOKENIZATION_SEED,
                self.asset.key().as_ref(),
                &[self.tokenization.bump],
            ]],
        );
        mint_to(cpi_ctx, total_supply)?;

        // Update asset
        self.asset.tokenize(self.mint.key(), &self.clock)?;

        // Update global config
        self.global_config.increment_total_tokenized_assets();

        // Emit event
        emit!(AssetTokenized {
            asset_id: self.asset.key(),
            mint: self.mint.key(),
            total_supply,
            tokenized_at: self.clock.unix_timestamp,
        });

        Ok(())
    }
}

