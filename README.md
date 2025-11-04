# Four-Meme-Bundler
This BNB bundler (four.meme), four meme bundler script is the tool that automatically creates and do bundle buy via Four.Meme. Feel free to reach out of me when you have any question [Telegram: https://t.me/DevCutup, Whatsapp: https://wa.me/13137423660].
This project uses `ethers v6` for signing and encoding, `viem` for simulation, and `axios` for Four.Meme + bundle API interactions.


## Features

- Programmatic login to Four.Meme using signed nonce
- Optional image upload to Four.Meme if a local path is provided
- Simulation of `createToken` call using `viem`
- Bundle construction and submission to BLXR/MEV relay on BSC
- Multi-wallet batched buy support right after creation


## It includes

- Token creation on the `FourMeme` contract
- Optional immediate buys from a list of developer wallets to seed demand/liquidity
- A small tip transaction to the bundle relayer/owner


## Key Files

- `src/index.ts` — Main orchestration: Four.Meme auth, simulation, bundle creation, and submission.
- `abi/FourMeme.json` — Minimal ABI for `createToken`, `buyTokenAMAP`, `sellToken`.
- `abi/ERC20.json` — Standard ERC20 ABI for post-creation balance checks.
- `tsconfig.json` — TypeScript compiler configuration.
- `package.json` — Project metadata and scripts.



## Requirements

- Node.js 18+
- BNB Chain RPC access (defaults to `https://bsc-dataseed.binance.org`)
- Owner and optional developer wallet private keys with enough BNB for fees and configured buys
- Four.Meme API access and BLXR bundle submit header


## Installation

```bash
npm install
```

## Build and Run

- Build TypeScript:

```bash
npm run build
```

- Run compiled build:

```bash
npm start
```

- Run in dev (ts-node):

```bash
npm run dev
```


## Environment Variables
Create a `.env` file in the project root with the following variables:

```bash
# Required: BLXR/Relay Authorization header for bundle submission
BLOX_AUTH_HEADER=Bearer <your-blxr-token-or-header>

# Required: Owner private key that will create the token
OWNER_PRIVATE_KEY=0x...

# Optional: Comma-separated list of dev wallet private keys for initial buys
DEV_WALLETS=0xabc...,0xdef...
```


## Test Result

- Bundle Hash: `0x06bbea6973899792e8332e3f9a418c399c56f56e85aafd76ddb93a00f6943125`
- Token Create Tx: https://bscscan.com/tx/0x8e42059f36a7595ea7f1fe0f69dc2aa01a8c5e975978acb31f80033ef7c3d35d
- Bundled Txs:
  - https://bscscan.com/tx/0x1a4a9234b881f90d45de9b3a070f0164bd1133ee032187ea35e43f0e6b2b8804
  - https://bscscan.com/tx/0xb5e88507d562bb77604ffff165c132ba6117562b7b7cd8a4271a6e36ad848983


## Contact Information

- **X (Twitter)**: [@devcutup](https://twitter.com/devcutup)
- **Telegram**: [@DevCutup](https://t.me/DevCutup)
- **WhatsApp**: [Contact via WhatsApp](https://wa.me/13137423660)
