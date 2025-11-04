import prompt from 'prompt-sync'
import axios, { AxiosResponse } from 'axios'
import FormData from 'form-data'
import { ethers, Wallet, Contract, JsonRpcProvider } from 'ethers'
import { readFileSync, writeFileSync, existsSync, createReadStream } from 'fs'
import 'dotenv/config'
import { createPublicClient, http, encodeFunctionData, getAddress, PublicClient, Account } from 'viem'
import { bsc } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

import abiERC20 from './abi/ERC20.json'
import abiFourMeme from './abi/FourMeme.json'

const promptSync = prompt()

const AUTH_HEADER: string | undefined = process.env.BLOX_AUTH_HEADER
const BUNDLE_OWNER = '0x74c5F8C6ffe41AD4789602BDB9a48E6Cad623520'
const API_ENDPOINT = 'https://four.meme/meme-api/v1/private'
const SUBMIT_ENDPOINT = 'https://api.blxrbdn.com'
const TRACE_ENDPOINT = 'https://tools.bloxroute.com/bscbundletrace'
const RPC_URL = 'https://bsc-dataseed.binance.org'
const FOUR_MEME_ADDRESS = '0x5c952063c7fc8610FFDB798152D69F0B9550762b'
// const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'
// const DEPLOYER_ADDRESS = '0x8D68E48bAEe3264eCd62A8B85B80F8558Cc1b499'
const TOPIC_CREATED = '0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20'
const CREATION_FEE = 10000000000000000n
const BUNDLE_TIP = 1000000000000000n
const GAS_PRICE = 1000000000n
const GAS_LIMIT_SEND = 70000n
const GAS_LIMIT_CREATE = 3000000n
const GAS_LIMIT_BUY = 235000n
const GAS_LIMIT_SELL = 1200000n
const GAS_LIMIT_APPROVE = 50000n

const client: PublicClient = createPublicClient({
  chain: bsc,
  transport: http()
})

const ART_LOGO = `
   ___                         __          __
  / __\\__  _   _ _ __ /\\/\\    /__\\/\\/\\    /__\\
 / _\\/ _ \\| | | | '__/    \\  /_\\ /    \\  /_\\
/ / | (_) | |_| | |_/ /\\/\\ \\//__/ /\\/\\ \\//__
\\/   \\___/ \\__,_|_(_)/    \\/\\__/\\/    \\/\\__/
`

const provider = new ethers.JsonRpcProvider(RPC_URL, 56)
const FourMeme = new ethers.Contract(FOUR_MEME_ADDRESS, abiFourMeme as any) as Contract

interface TokenData {
    preSale: number
    imgUrl?: string
}

interface BundleResult {
    nonces: Record<string, number>
    txns: string[]
}

interface NonceResponse {
    data: {
        data: string
    }
}

interface AccessResponse {
    data: {
        data: string
    }
}

interface CreationResponse {
    code: number
    msg?: string
    data?: {
        createArg: string
        signature: string
    }
}

function promptEnforce(ask: string, rxp: RegExp = /.{1,255}/): string {
    for(let i = 0; i<5; i++) {
        const res = promptSync(ask)
        if (res && rxp.test(res))
            return res
    }
    throw Error('Input error')
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
    const owner = readOwner()
    const balance = await provider.getBalance(owner.address)
    while (true) {

    }
}

function readOwner(): Wallet {
    if (!existsSync('./owner.key')) {
        const key = promptSync('Input private key:')
        if (!key) {
            throw new Error('Private key is required')
        }
        writeFileSync('./owner.key', key)
        return new ethers.Wallet(key, provider)
    }
    const key = readFileSync('./owner.key')
    return new ethers.Wallet(key.toString().trim(), provider)
}

function readWallets(): Wallet[] {
    if (!existsSync('./wallets.txt'))
        return []
    const keys = readFileSync('./wallets.txt').toString().split('\n').filter(Boolean)
    return keys.map(key => new ethers.Wallet(key, provider))
}

async function configWallets(owner: Wallet): Promise<void> {
    const wallets: Wallet[] = []
    const action = promptSync('Do you want to (c)reate new wallets or (a)dd more wallets or (u)se existing ones? (c/a/u): ')
    if (action == 'a' || action == 'u') {
        wallets.push(...readWallets())
    }
    if (action == 'c' || action == 'a') {
        const numOfWalletsStr = promptSync('Input number of wallets to creat: ')
        if (!numOfWalletsStr) {
            console.log('Invalid input.');
            return;
        }
        const numOfWallets = Number(numOfWalletsStr)
        if (isNaN(numOfWallets) || numOfWallets <= 0) {
            console.log('Invalid number. Please enter a positive integer.')
            return
        }
        wallets.push(...new Array(numOfWallets).fill(0).map(() => ethers.Wallet.createRandom().connect(provider)))
        writeFileSync('./wallets.txt', wallets.map(w => w.privateKey).join('\n'))
    }
    for(const w of wallets) {
        const balance = await provider.getBalance(w.address)
        console.log(w.address, `${ethers.formatEther(balance)} BNB`)
    }
    const willPay = promptSync("Would you like to send BNB to wallets?(Y/n)")
    if (willPay == 'y' || willPay == 'Y') {
        await sendBNB(owner)
    }
    promptSync('Press Enter to return')
}

async function prepareBundle(wallets: Wallet[]): Promise<BundleResult> {
    const nonces: Record<string, number> = {}
    const txns: string[] = []
    
    for (const wallet of wallets) {
        const nonce = await provider.getTransactionCount(wallet.address, 'pending')
        nonces[wallet.address] = nonce
    }
    
    return { nonces, txns }
}

async function sendBundle(txns: string[]): Promise<boolean> {
    // TODO: Implement bundle sending logic
    return false
}

async function createToken(owner: Wallet): Promise<void> {
    const tokenData: TokenData = { preSale: 0.1 }

    const willPayStr = promptSync('Will you include payments in bundle(Y/n)?')
    const willPay = Boolean(willPayStr && (willPayStr.toLowerCase() === 'y'))
    
    const nonceResponse: AxiosResponse<NonceResponse> | undefined = await axios.post(`${API_ENDPOINT}/user/nonce/generate`, {
        accountAddress: owner.address,
        verifyType: 'LOGIN',
        networkCode: 'BSC'
    }).catch(console.error) as AxiosResponse<NonceResponse> | undefined
    
    if (!nonceResponse?.data?.data) {
        console.error('Failed to get nonce')
        return
    }
    
    const signature = await owner.signMessage(`You are sign in Meme ${nonceResponse.data.data}`)
    
    const accessResponse: AxiosResponse<AccessResponse> | undefined = await axios.post(`${API_ENDPOINT}/user/login/dex`, {
        region: "WEB",
        langType: "EN",
        loginIp: "",
        inviteCode: "",
        verifyInfo: {
            address: owner.address,
            networkCode: "BSC",
            signature,
            verifyType: "LOGIN"
        },
        walletName: "MetaMask"
    }).catch(console.error) as AxiosResponse<AccessResponse> | undefined
    
    if (!accessResponse?.data?.data) {
        console.error('Failed to get access token')
        return
    }
    
    if (tokenData.imgUrl && !tokenData.imgUrl.startsWith("https://")) {
        const formData = new FormData()
        formData.append('file', createReadStream(tokenData.imgUrl))
        const uploadResponse = await axios.post(`${API_ENDPOINT}/token/upload`, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
                'meme-web-access': accessResponse.data.data
            }
        }).catch(console.error)
        
        if (uploadResponse?.data?.data) {
            tokenData.imgUrl = uploadResponse.data.data
        }
    }

    // TODO: Implement creation API call
    const creation: CreationResponse = { code: 0 } // Placeholder - replace with actual API call
    
    if (creation.code !== 0) {
        console.log('creation error:', creation.msg)
        return
    }
    
    if (!creation.data) {
        console.error('No creation data')
        return
    }
    
    const account: Account = privateKeyToAccount(owner.privateKey as `0x${string}`)
    
    const simulation = await client.simulateCalls({
        account,
        calls: [{
            to: FOUR_MEME_ADDRESS,
            data: encodeFunctionData({
                abi: abiFourMeme as any,
                functionName: 'createToken',
                args: [creation.data.createArg, creation.data.signature],
            }),
            value: ethers.parseEther(String(tokenData.preSale)) + CREATION_FEE
        }]
    })
    
    const log = simulation.results[0].logs.find((log: any) => log.address.toLowerCase() == FOUR_MEME_ADDRESS.toLowerCase() && log.topics[0] == TOPIC_CREATED)
    
    if (!log?.data) {
        console.error('No log data found')
        return
    }
    
    const token = getAddress(`0x${log.data.slice(90, 130)}`)
    console.log(token)
    
    const wallets = readWallets()
    const { nonces, txns } = await prepareBundle([owner, ...wallets])
    
    const signedTx = await owner.signTransaction({
        to: FOUR_MEME_ADDRESS,
        data: FourMeme.interface.encodeFunctionData('createToken', [creation.data.createArg, creation.data.signature]),
        nonce: nonces[owner.address]++,
        value: ethers.parseEther(String(tokenData.preSale)) + CREATION_FEE,
        gasLimit: GAS_LIMIT_CREATE,
        gasPrice: GAS_PRICE,
        chainId: 56
    })
    
    txns.push(signedTx)
}

async function buyTokens(owner: Wallet): Promise<void> {
    // TODO: Implement buy tokens logic
}

async function sendBNB(owner: Wallet): Promise<void> {
    const sendAmount = Number(promptEnforce('amount(BNB): ', /\d(\.\d*)?/))
    const userCount = sendAmount > 0 ? Number(promptEnforce('Wallet count: ', /\d+/)) : 0
    if (userCount > 0) {
        const wallets = readWallets()
        const { nonces, txns } = await prepareBundle([owner])
        for(let i = 0; i<Math.min(userCount, wallets.length); i++) {
            const signedTx = await owner.signTransaction({
                to: wallets[i].address,
                data: '0x',
                nonce: nonces[owner.address]++,
                value: ethers.parseEther(String(sendAmount)) + GAS_LIMIT_BUY * GAS_PRICE,
                gasLimit: GAS_LIMIT_SEND,
                gasPrice: GAS_PRICE,
                chainId: 56
            })
            txns.push(signedTx)
        }
        if (await sendBundle(txns)) {
            // Bundle sent successfully
        }
    }
}

async function sellTokens(owner: Wallet): Promise<void> {
    // TODO: Implement sell tokens logic
}

main().catch(console.error)
