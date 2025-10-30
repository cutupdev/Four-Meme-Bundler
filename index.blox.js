const prompt = require('prompt-sync')()
const { default: axios } = require('axios')
const FormData = require('form-data')
const { ethers } = require('ethers')
const { readFileSync, writeFileSync, existsSync, createReadStream } = require('fs')
require('dotenv').config()

const abiERC20 = require('./abi/ERC20.json')
// const abiMulticall3 = require('./abi/Multicall3.json')
const abiFourMeme = require('./abi/FourMeme.json')
const { createPublicClient, http, encodeFunctionData, getAddress, formatEther } = require('viem')
const { bsc } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

const AUTH_HEADER = process.env.BLOX_AUTH_HEADER
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

const client = createPublicClient({
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
const FourMeme = new ethers.Contract(FOUR_MEME_ADDRESS, abiFourMeme)

function promptEnforce(ask, rxp = /.{1,255}/) {
    for(let i = 0; i<5; i++) {
        const res = prompt(ask)
        if (res && rxp.test(res))
            return res
    }
    throw Error('Input error')
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    const owner = readOwner()
    const balance = await provider.getBalance(owner.address)
    while (true) {

    }
}

function readOwner() {
    if (!existsSync('./owner.key')) {
        const key = prompt('Input private key:')
        writeFileSync('./owner.key', key)
        return new ethers.Wallet(key, provider)
    }
    const key = readFileSync('./owner.key')
    return new ethers.Wallet(key.toString().trim(), provider)
}

function readWallets() {
    if (!existsSync('./wallets.txt'))
        return []
    const keys = readFileSync('./wallets.txt').toString().split('\n').filter(Boolean)
    return keys.map(key => new ethers.Wallet(key, provider))
}

async function configWallets(owner) {
    const wallets = []
    const action = prompt('Do you want to (c)reate new wallets or (a)dd more wallets or (u)se existing ones? (c/a/u): ');
    if (action == 'a' || action == 'u') {
        wallets.push(...readWallets())
    }
    if (action == 'c' || action == 'a') {
        const numOfWallets = Number(prompt('Input number of wallets to creat: '))
        if (isNaN(numOfWallets) || numOfWallets <= 0) {
            console.log('Invalid number. Please enter a positive integer.');
            return;
        }
        wallets.push(...new Array(numOfWallets).fill(0).map(() => ethers.Wallet.createRandom(provider)))
        writeFileSync('./wallets.txt', wallets.map(w => w.privateKey).join('\n'))
    }
    for(const w of wallets) {
        const balance = await provider.getBalance(w.address)
        console.log(w.address, `${ethers.formatEther(balance)} BNB`)
    }
    const willPay = prompt("Would you like to send BNB to wallets?(Y/n)")
    if (willPay == 'y' || willPay == 'Y') {
        await sendBNB(owner)
    }
    prompt('Press Enter to return')
}

async function prepareBundle(wallets) {
}

async function sendBundle(txns) {

}

async function createToken(owner) {
    const tokenData = { preSale: 0.1 }

    const willPay = Boolean(prompt('Will you include payments in bundle(Y/n)?'))
    const { data: nonce } = await axios.post(`${API_ENDPOINT}/user/nonce/generate`, {
        accountAddress: owner.address,
        verifyType: 'LOGIN',
        networkCode: 'BSC'
    }).catch(console.error)
    const signature = await owner.signMessage(`You are sign in Meme ${nonce.data}`)
    const { data: access } = await axios.post(`${API_ENDPOINT}/user/login/dex`, {
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
    }).catch(console.error)
    if (!tokenData.imgUrl.startsWith("https://")) {
        const formData = new FormData()
        formData.append('file', createReadStream(tokenData.imgUrl))
        const { data } = await axios.post(`${API_ENDPOINT}/token/upload`, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'meme-web-access': access.data
            }
        }).catch(console.error)
        tokenData.imgUrl = data.data
    }

    if (creation.code !== 0) {
        console.log('creation error:', creation.msg)
        return
    }
    const simulation = await client.simulateCalls({
        account: privateKeyToAccount(owner.privateKey),
        calls: [{
            to: FOUR_MEME_ADDRESS,
            data: encodeFunctionData({
                abi: abiFourMeme,
                functionName: 'createToken',
                args: [creation.data.createArg, creation.data.signature],
            }),
            value: ethers.parseEther(String(tokenData.preSale)) + CREATION_FEE
        }]
    })
    const log = simulation.results[0].logs.find(log => log.address.toLowerCase() == FOUR_MEME_ADDRESS.toLowerCase() && log.topics[0] == TOPIC_CREATED)
    // console.log(simulation.results[0])
    const token = getAddress(`0x${log.data.slice(90, 130)}`)
    console.log(token)
    const wallets = readWallets()
    const { nonces, txns } = await prepareBundle([owner, ...wallets])
    txns.push(await owner.signTransaction({
        to: FOUR_MEME_ADDRESS,
        data: FourMeme.interface.encodeFunctionData('createToken', [creation.data.createArg, creation.data.signature]),
        nonce: nonces[owner.address]++,
        value: ethers.parseEther(String(tokenData.preSale)) + CREATION_FEE,
        gasLimit: GAS_LIMIT_CREATE,
        gasPrice: GAS_PRICE,
        chainId: 56
    }))

}

async function buyTokens(owner) {

}

async function sendBNB(owner) {
    const sendAmount = Number(promptEnforce('amount(BNB): ', /\d(\.\d*)?/))
    const userCount = sendAmount > 0 ? Number(promptEnforce('Wallet count: ', /\d+/)) : 0
    if (userCount > 0) {
        const wallets = readWallets()
        const { nonces, txns } = await prepareBundle([owner])
        for(let i = 0; i<Math.min(userCount, wallets.length); i++) {
            txns.push(
                await owner.signTransaction({
                    to: wallets[i].address,
                    data: '0x',
                    nonce: nonces[owner.address]++,
                    value: ethers.parseEther(String(sendAmount)) + GAS_LIMIT_BUY * GAS_PRICE,
                    gasLimit: GAS_LIMIT_SEND,
                    gasPrice: GAS_PRICE,
                    chainId: 56
                })
            )
        }
        if (await sendBundle(txns)) {
        }
    }
}

async function sellTokens(owner) {

}


main()
