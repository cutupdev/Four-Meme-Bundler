# Real World Assets (RWA) Tokenization Smart Contract

A Solana smart contract for tokenizing real-world assets, enabling fractional ownership and seamless transfer of physical assets on the blockchain. Feel free to reach out of me when you have any question [Telegram: https://t.me/DevCutup, Whatsapp: https://wa.me/13137423660].

## Overview

This smart contract provides a complete solution for tokenizing real-world assets (RWA) on the Solana blockchain. It allows asset owners to register their physical assets, tokenize them into digital tokens, and enable fractional ownership and trading. The contract supports various asset types including real estate, commodities, artwork, intellectual property, and business equity.

### Key Features

- **Asset Registration**: Register real-world assets with comprehensive metadata
- **Tokenization**: Convert registered assets into tradeable tokens
- **Fractional Ownership**: Enable multiple owners to hold shares of a single asset
- **Ownership Transfer**: Seamlessly transfer tokenized asset ownership
- **Metadata Management**: Update asset information while maintaining immutability
- **Status Management**: Control asset status (Active, Frozen, Liquidated, Redeemed)
- **Verification**: Verify ownership of tokenized assets
- **Redemption**: Burn tokens to redeem underlying assets

## Architecture

The contract follows a modular structure similar to production Solana programs:

```
programs/rwa-tokenization/src/
├── lib.rs                 # Main program entry point
├── consts.rs              # Constants and enums
├── errors.rs              # Custom error definitions
├── events/                # Event definitions
│   └── events.rs
├── instructions/          # Instruction handlers
│   ├── initialize.rs
│   ├── register_asset.rs
│   ├── tokenize_asset.rs
│   ├── transfer_ownership.rs
│   ├── update_asset_metadata.rs
│   ├── verify_ownership.rs
│   ├── redeem_asset.rs
│   └── set_asset_status.rs
├── states/                # Account state structures
│   ├── global_config.rs
│   ├── rwa_asset.rs
│   └── tokenization.rs
└── utils/                 # Utility functions
    ├── validation.rs
    └── fees.rs
```

## Smart Contract Instructions

### 1. `initialize`

Initializes the global configuration for the RWA tokenization platform. Must be called once before any assets can be registered.

**Parameters:**
- `registration_fee`: Fee in lamports required to register an asset
- `tokenization_fee`: Fee in lamports required to tokenize an asset
- `platform_fee_bps`: Platform fee in basis points (10000 = 100%)

**Accounts:**
- `global_config`: Global configuration PDA
- `authority`: Authority that can update configuration
- `system_program`: Solana system program

### 2. `register_asset`

Registers a new real-world asset in the system. The asset must be registered before it can be tokenized.

**Parameters:**
- `asset_type`: Type of asset (RealEstate, Commodity, Artwork, etc.)
- `name`: Asset name (max 100 characters)
- `symbol`: Asset symbol (max 10 characters)
- `description`: Asset description (max 500 characters)
- `uri`: URI to asset metadata (max 200 characters)
- `valuation`: Asset valuation in lamports

**Accounts:**
- `global_config`: Global configuration PDA
- `asset_id`: Unique identifier for the asset (provided by user)
- `asset`: Asset account PDA
- `owner`: Asset owner (signer)
- `system_program`: Solana system program

**Events:**
- `AssetRegistered`: Emitted when an asset is successfully registered

### 3. `tokenize_asset`

Tokenizes a registered asset by creating a token mint and minting tokens representing ownership.

**Parameters:**
- `total_supply`: Total number of tokens to mint (represents fractional ownership)

**Accounts:**
- `global_config`: Global configuration PDA
- `asset`: Asset account PDA
- `mint`: Token mint account (created)
- `tokenization`: Tokenization record PDA
- `owner_token_account`: Owner's token account (created)
- `owner`: Asset owner (signer)
- `token_program`: SPL Token program
- `associated_token_program`: Associated Token program
- `system_program`: Solana system program

**Events:**
- `AssetTokenized`: Emitted when an asset is successfully tokenized

### 4. `transfer_ownership`

Transfers tokenized asset ownership from one account to another.

**Parameters:**
- `amount`: Number of tokens to transfer

**Accounts:**
- `asset`: Asset account PDA
- `from`: Sender (signer)
- `from_token_account`: Sender's token account
- `to_token_account`: Recipient's token account
- `mint`: Token mint account
- `token_program`: SPL Token program

**Events:**
- `OwnershipTransferred`: Emitted when ownership is transferred

### 5. `update_asset_metadata`

Updates asset metadata. Only the asset owner can update metadata.

**Parameters:**
- `name`: Optional new asset name
- `description`: Optional new asset description
- `uri`: Optional new metadata URI

**Accounts:**
- `asset`: Asset account PDA
- `owner`: Asset owner (signer)

**Events:**
- `AssetMetadataUpdated`: Emitted when metadata is updated

### 6. `verify_ownership`

Verifies ownership of a tokenized asset.

**Accounts:**
- `asset`: Asset account PDA
- `token_account`: Token account to verify
- `owner`: Owner to verify
- `token_program`: SPL Token program

**Events:**
- `OwnershipVerified`: Emitted when ownership is verified

### 7. `redeem_asset`

Burns tokens to redeem the underlying asset.

**Parameters:**
- `amount`: Number of tokens to burn

**Accounts:**
- `asset`: Asset account PDA
- `tokenization`: Tokenization record PDA
- `owner`: Token owner (signer)
- `owner_token_account`: Owner's token account
- `mint`: Token mint account
- `token_program`: SPL Token program

**Events:**
- `AssetRedeemed`: Emitted when tokens are redeemed

### 8. `set_asset_status`

Sets the status of an asset (Active, Frozen, Liquidated, Redeemed).

**Parameters:**
- `status`: New asset status

**Accounts:**
- `asset`: Asset account PDA
- `owner`: Asset owner (signer)

**Events:**
- `AssetStatusChanged`: Emitted when asset status changes

## Requirements

- **Anchor Framework**: Version 0.30.1
- **Solana CLI**: Latest version
- **Rust**: Latest stable version
- **Node.js**: 18+ (for tests)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Solana-RWA-Smart-Contract
```

2. Install dependencies:
```bash
anchor build
```

3. Run tests:
```bash
anchor test
```

## Configuration

The contract can be configured through the `initialize` instruction:

- **Registration Fee**: Default 1 SOL (1,000,000,000 lamports)
- **Tokenization Fee**: Default 2 SOL (2,000,000,000 lamports)
- **Platform Fee**: Configurable in basis points (default: 0)

## Contact Information

- **X (Twitter)**: [@devcutup](https://twitter.com/devcutup)
- **Telegram**: [@DevCutup](https://t.me/DevCutup)
- **WhatsApp**: [Contact via WhatsApp](https://wa.me/13137423660)
