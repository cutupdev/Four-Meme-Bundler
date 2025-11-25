import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RwaTokenization } from "../target/types/rwa_tokenization";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("rwa-tokenization", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RwaTokenization as Program<RwaTokenization>;
  
  const authority = Keypair.generate();
  const owner = Keypair.generate();
  const assetId = Keypair.generate();

  it("Initializes the global configuration", async () => {
    const [globalConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("rwa_global_config")],
      program.programId
    );

    const tx = await program.methods
      .initialize({
        registrationFee: new anchor.BN(1_000_000_000), // 1 SOL
        tokenizationFee: new anchor.BN(2_000_000_000), // 2 SOL
        platformFeeBps: 0,
      })
      .accounts({
        globalConfig,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Initialize transaction signature", tx);

    const config = await program.account.globalConfig.fetch(globalConfig);
    expect(config.isInitialized).to.be.true;
    expect(config.registrationFee.toNumber()).to.equal(1_000_000_000);
  });

  it("Registers a new asset", async () => {
    const [globalConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("rwa_global_config")],
      program.programId
    );

    const [asset] = PublicKey.findProgramAddressSync(
      [Buffer.from("rwa_asset"), assetId.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop SOL to owner
    await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const tx = await program.methods
      .registerAsset({
        assetType: { other: {} },
        name: "Test Asset",
        symbol: "TEST",
        description: "A test asset for tokenization",
        uri: "https://example.com/metadata.json",
        valuation: new anchor.BN(10_000_000_000_000), // 10,000 SOL
      })
      .accounts({
        globalConfig,
        assetId: assetId.publicKey,
        asset,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("Register asset transaction signature", tx);

    const assetAccount = await program.account.rwaAsset.fetch(asset);
    expect(assetAccount.name).to.equal("Test Asset");
    expect(assetAccount.isTokenized).to.be.false;
  });

  // Add more tests for other instructions...
});

