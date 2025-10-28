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
        console.log([
            '',
            ART_LOGO,
            `   (owner: ${owner.address.slice(0,6)}...${owner.address.slice(-4)} ${Number(ethers.formatEther(balance)).toFixed(6)} BNB)`,
            '',
            '\t1. Create wallets',
            '\t2. Create token & buy',
            '\t3. Buy tokens',
            '\t4. Sell tokens',
            '\t5. Withdraw BNB',
            '\tType "exit" to exit',
            '',
        ].join('\n'))
        const k = prompt('Input number(1-5): ')
        try {
            if (k == 'exit')
                return
            if (k == 1)
                await configWallets(owner)
            else if (k == 2)
                await createToken(owner)
            else if (k == 3)
                await buyTokens(owner)
        } catch(ex) {
            console.error("error", ex)
            writeFileSync('error.txt', JSON.stringify(ex, undefined, 4))
        }
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
    const nonces = {};
    (await Promise.all(wallets.map(w => provider.getTransactionCount(w.address)))).forEach((nonce, i) => nonces[wallets[i].address] = nonce)
    return {
        nonces,
        txns: []
    }
}

async function sendBundle(txns) {
    if (txns.length == 0)
        return false
    const blockNumber = await provider.getBlockNumber()
    const { data: bundle } = await axios.post(SUBMIT_ENDPOINT, {
        id: 1,
        method: "blxr_submit_bundle",
        params: {
            transaction: txns.map(tx => tx.slice(2)),
            blockchain_network: "BSC-Mainnet",
            block_number: `0x${Number(blockNumber + 50).toString(16)}`,
            state_block_number: "latest",
            mev_builders: {
                all: ''
            }
        }
    }, {
        headers: {
            Authorization: AUTH_HEADER
        },
        // rejectUnauthorized: false,
    })
    if (bundle.result) {
        console.log('Bundle has submitted!', bundle.result)
        // let onChain = false
        // while(true) {
        //     const { data: status } = await axios.get(`${TRACE_ENDPOINT}/${bundle.result.bundleHash}`, {
        //         params: {
        //             auth_header: AUTH_HEADER
        //         },
        //     })
        //     if (status.blockNumber > 0) {
        //         onChain = true
        //         break
        //     }
        //     if (status.code !== undefined) {
        //         console.log('Error:', status.message)
        //         break
        //     }
        //     console.log(status)
        //     await sleep(5000)
        // }
        // if (onChain) {
        //     console.log('Bundle executed!')
        //     return true
        // }
    } else {
        console.log(bundle.error)
    }
    return false
}

async function createToken(owner) {
    const tokenData = { preSale: 0.1 }
    try {
        tokenData.name = promptEnforce('Token Name(*): ')
        tokenData.shortName = promptEnforce('Token Symbol(*): ')
        tokenData.desc = promptEnforce('Description(*): ')
        tokenData.imgUrl = promptEnforce('Logo URL or path(*): ')
        tokenData.webUrl = prompt('Website: ', undefined)
        tokenData.twitterUrl = prompt('Twitter: ', undefined)
        tokenData.telegramUrl = prompt('Telegram: ', undefined)
        tokenData.preSale = Number(promptEnforce('Presale amount(BNB): ', /\d(\.\d*)?/))
        tokenData.buyAmount = Number(promptEnforce('Buy amount(BNB): ', /\d(\.\d*)?/))
        tokenData.buyCount = tokenData.buyAmount > 0 ? Number(promptEnforce('Buyer count: ', /\d+/)) : 0
    } catch(ex) {
        return
    }
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
    const { data: creation } = await axios.post(`${API_ENDPOINT}/token/create`, {
        name: tokenData.name,
        shortName: tokenData.shortName,
        desc: tokenData.desc,
        imgUrl: tokenData.imgUrl,
        ...(tokenData.webUrl ? { webUrl: tokenData.webUrl } : {}),
        ...(tokenData.twitterUrl ? { twitterUrl: tokenData.twitterUrl } : {}),
        ...(tokenData.telegramUrl ? { telegramUrl: tokenData.telegramUrl } : {}),
        dexType: "PANCAKE_SWAP",
        totalSupply: 1000000000,
        raisedAmount: 18,
        saleRate: 0.8,
        reserveRate: 0,
        raisedToken: {
            symbol: "BNB",
            nativeSymbol: "BNB",
            symbolAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            deployCost: formatEther(CREATION_FEE),
            buyFee: "0.01",
            sellFee: "0.01",
            minTradeFee: "0",
            b0Amount: "8",
            totalBAmount: "18",
            totalAmount: "1000000000",
            logoUrl: tokenData.imgUrl,
            tradeLevel: [
                "0.1",
                "0.5",
                "1"
            ],
            status: "PUBLISH",
            buyTokenLink: "https://pancakeswap.finance/swap",
            reservedNumber: 10,
            saleRate: "0.8",
            networkCode: "BSC",
            platform: "MEME"
        },
        launchTime: Date.now(),
        onlyMPC: false,
        funGroup: false,
        clickFun: false,
        symbol: "BNB",
        label: "Meme",
        lpTradingFee: 0.0025
    }, {
        headers: {
            'meme-web-access': access.data
        }
    })
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
    if (tokenData.buyCount > 0) {
        for(let i = 0; i<Math.min(wallets.length, tokenData.buyCount); i++) {
            if (willPay) {
                txns.push(
                    await owner.signTransaction({
                        to: wallets[i].address,
                        data: '0x',
                        nonce: nonces[owner.address]++,
                        value: ethers.parseEther(String(tokenData.buyAmount)) + GAS_LIMIT_BUY * GAS_PRICE,
                        gasLimit: GAS_LIMIT_SEND,
                        gasPrice: GAS_PRICE,
                        chainId: 56
                    })
                )
            }
            txns.push(
                await wallets[i].signTransaction({
                    to: FOUR_MEME_ADDRESS,
                    data: FourMeme.interface.encodeFunctionData('buyTokenAMAP', [token, ethers.parseEther(String(tokenData.buyAmount)), 1]),
                    nonce: nonces[wallets[i].address]++,
                    value: ethers.parseEther(String(tokenData.buyAmount)),
                    gasLimit: GAS_LIMIT_BUY,
                    gasPrice: GAS_PRICE,
                    chainId: 56
                })
            )
        }
    }
    txns.push(await owner.signTransaction({
        to: BUNDLE_OWNER,
        // data: '0x',
        nonce: nonces[owner.address]++,
        value: BUNDLE_TIP,
        gasLimit: GAS_LIMIT_SEND,
        gasPrice: GAS_PRICE,
        chainId: 56
    }))
    if (await sendBundle(txns)) {
        const Token = new ethers.Contract(token, abiERC20, provider)
        for(const w of wallets) {
            const balance = await Token.balanceOf(w.address).catch(() => 0n)
            console.log(w.address, `${ethers.formatEther(balance)} ${tokenData.shortName}`)
        }
    }
    prompt('Press Enter to return')
}

async function buyTokens(owner) {
    const token = promptEnforce('Input token address: ', /0x[0-9a-f]{40}/i)
    const buyAmount = Number(promptEnforce('Buy amount(BNB): ', /\d(\.\d*)?/))
    const buyCount = buyAmount > 0 ? Number(promptEnforce('Buyer count: ', /\d+/)) : 0
    if (buyCount > 0) {
        const wallets = readWallets()
        const { nonces, txns } = await prepareBundle(wallets)
        for(let i = 0; i<Math.min(buyCount, wallets.length); i++) {
            // await client.simulateCalls({
            //     account: privateKeyToAccount(wallets[i].privateKey),
            //     calls: [{
            //         to: FOUR_MEME_ADDRESS,
            //         data: FourMeme.interface.encodeFunctionData('buyTokenAMAP', [token, ethers.parseEther(String(buyAmount)), 1]),
            //         nonce: nonces[i],
            //         value: ethers.parseEther(String(buyAmount)),
            //         // gasLimit: GAS_LIMIT_BUY,
            //         // gasPrice: GAS_PRICE,
            //         chainId: 56
            //     }]
            // })
            txns.push(
                // await owner.signTransaction({
                //     to: wallets[i].address,
                //     data: '0x',
                //     nonce: nonceOwner + i,
                //     value: ethers.parseEther(String(buyAmount)) + GAS_LIMIT_BUY * GAS_PRICE,
                //     gasLimit: GAS_LIMIT_SEND,
                //     gasPrice: GAS_PRICE,
                //     chainId: 56
                // }),
                await wallets[i].signTransaction({
                    to: FOUR_MEME_ADDRESS,
                    data: FourMeme.interface.encodeFunctionData('buyTokenAMAP', [token, ethers.parseEther(String(buyAmount)), 1]),
                    nonce: nonces[wallets[i].address]++,
                    value: ethers.parseEther(String(buyAmount)),
                    gasLimit: GAS_LIMIT_BUY,
                    gasPrice: GAS_PRICE,
                    chainId: 56
                })
            )
        }
        if (await sendBundle(txns)) {
            const Token = new ethers.Contract(token, abiERC20, provider)
            const symbol = await Token.symbol()
            for(const w of wallets) {
                const balance = await Token.balanceOf(w.address).catch(() => 0n)
                console.log(w.address, `${ethers.formatEther(balance)} ${symbol}`)
            }
        }
    }
    prompt('Press Enter to return')
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
    const token = promptEnforce('Input token address: ', /0x[0-9a-f]{40}/i)
    const wallets = readWallets()
    wallets.push(owner)
    const Token = new ethers.Contract(token, abiERC20, provider)
    const balances = await Promise.all(wallets.map(w => Token.balanceOf(w.address)))
    const { nonces, txns } = await prepareBundle([owner, ...wallets])
    for(let i = 0; i<wallets.length; i++) {
        if (balances[i] <= 0n)
            continue
        txns.push(
            await wallets[i].signTransaction({
                to: token,
                data: Token.interface.encodeFunctionData('approve', [FOUR_MEME_ADDRESS, balances[i]]),
                nonce: nonces[wallets[i].address]++,
                gasLimit: GAS_LIMIT_APPROVE,
                gasPrice: GAS_PRICE,
                chainId: 56
            }),
            await wallets[i].signTransaction({
                to: FOUR_MEME_ADDRESS,
                data: FourMeme.interface.encodeFunctionData('sellToken', [token, balances[i]]),
                nonce: nonces[wallets[i].address]++,
                gasLimit: GAS_LIMIT_SELL,
                gasPrice: GAS_PRICE,
                chainId: 56
            })
        )
    }
    if (await sendBundle(txns)) {
        const Token = new ethers.Contract(token, abiERC20, provider)
        const symbol = await Token.symbol()
        for(const w of wallets) {
            const balance = await Token.balanceOf(w.address).catch(() => 0n)
            console.log(w.address, `${ethers.formatEther(balance)} ${symbol}`)
        }
    }
    prompt('Press Enter to return')
}


main()
