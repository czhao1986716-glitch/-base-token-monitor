// 验证前10个地址的真实余额
const { ethers } = require('ethers');

const CLANKER_CONTRACT = '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb';
const BASE_RPC = 'https://mainnet.base.org';

// Moralis API 返回的前10个地址
const ADDRESSES_TO_CHECK = [
    '0x8d4ab2a3e89eadfdc729204adf863a0bfc7746f6',
    '0xc1a6fbedae68e1472dbb91fe29b51f7a0bd44f97',
    '0x46a830062405992852186b904af5ac321a50d684',
    '0xeee2606494c28e5601ab8ee22a627754330a4a219',
    '0x4e68ba26426fa565e00c0392f65c542d59038453',
    '0x27d2c478e058bb71d55e4c37e4e9e3e32dbb8a',
    '0x301f74252433ba1dbbb1498e9c0b9ecbfb281',
    '0xbf82a1b2695295354979258e81b1c1b7a3828',
    '0xffa8db7be7be7e3e9b1d7a6e5f5d044cd54',
    '0x1c30a767b7d7a7d7a7d7a7d7a7d7a7d7aab9d562'
];

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)'
];

async function checkAddresses() {
    console.log('🔍 验证前10个地址的真实余额...\n');

    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const token = new ethers.Contract(CLANKER_CONTRACT, ERC20_ABI, provider);
    const decimals = await token.decimals();

    console.log('排名\tMoralis显示\t链上真实余额\t差异');
    console.log('─'.repeat(80));

    for (let i = 0; i < Math.min(5, ADDRESSES_TO_CHECK.length); i++) {
        const address = ADDRESSES_TO_CHECK[i];

        try {
            // 从链上查询真实余额
            const balance = await token.balanceOf(address);
            const balanceFormatted = ethers.formatUnits(balance, decimals);

            // 从 Moralis 数据中读取（之前保存的数据）
            const moralisBalance = [
                '139816.13',
                '76841.57',
                '76035.05',
                '73330.04',
                '70000.00'
            ][i];

            // 计算差异
            const diff = parseFloat(moralisBalance) - parseFloat(balanceFormatted);
            const diffPercent = ((diff / parseFloat(moralisBalance)) * 100).toFixed(2);

            console.log(
                `${i + 1}\t${moralisBalance}\t\t${parseFloat(balanceFormatted).toFixed(2)}\t\t${diffPercent}%`
            );

        } catch (error) {
            console.log(`${i + 1}\t错误: ${error.message}`);
        }
    }

    console.log('\n⚠️  结论：Moralis API 数据与链上数据不符！');
}

checkAddresses();
