// 调试版本：查看前几个地址的余额查询结果
const https = require('https');
const { ethers } = require('ethers');

const CLANKER_CONTRACT = '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb';
const BASE_RPC = 'https://mainnet.base.org';
const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImRmYTE0NGZmLWMzOGQtNDYwZS1iMTM5LWEwNzg2MWQ4YTE0MCIsIm9yZ0lkIjoiNTA3MDgwIiwidXNlcklkIjoiNTIxNzUzIiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiI0YWQ4MDljOC02MzFiLTRlZjMtYWRjZi03NTczMGVhNjUwMzYiLCJpYXQiOjE3NzQ0ODk0NzIsImV4cCI6NDkzMDI0OTQ3Mn0.r3JzYFWeMMfuuZVbxTlJqeLI43ofkal7TKR8aSl4a9Y';

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)'
];

async function testFirstAddresses() {
    console.log('🔍 测试前5个地址的余额查询...\n');

    // 获取前5个地址
    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${CLANKER_CONTRACT}/owners?chain=base&limit=5`;

    const moralisHolders = await new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'accept': 'application/json',
                'X-API-Key': MORALIS_API_KEY
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const response = JSON.parse(data);
                    resolve(response.result || []);
                } else {
                    reject(new Error(`API Error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });

    console.log(`从 Moralis 获取到 ${moralisHolders.length} 个地址\n`);

    // 连接到 Base 链
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const token = new ethers.Contract(CLANKER_CONTRACT, ERC20_ABI, provider);
    const decimals = await token.decimals();

    console.log('Moralis数据\t\t\t\t链上查询结果\t\t\t格式化余额\t\t是否保留');
    console.log('─'.repeat(120));

    for (const holder of moralisHolders) {
        try {
            const address = holder.owner_address;
            const moralisBalance = holder.balance_formatted;

            const balance = await token.balanceOf(address);
            const balanceFormatted = ethers.formatUnits(balance, decimals);
            const balanceNum = parseFloat(balanceFormatted);

            const shouldKeep = balanceNum >= 0.000001;

            console.log(
                `${moralisBalance}\t\t${balanceFormatted}\t\t${shouldKeep ? '✅ 保留' : '❌ 过滤'}`
            );

        } catch (error) {
            console.log(`查询失败: ${error.message}`);
        }
    }
}

testFirstAddresses();
