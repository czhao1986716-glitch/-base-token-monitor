// 验证指定地址的 clanker 代币余额
const https = require('https');
const { ethers } = require('ethers');

// 配置
const CLANKER_CONTRACT = '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb';
const ADDRESS_TO_CHECK = '0x4e68ba26426fa565e00c0392f65c542d59038453';
const BASE_RPC = 'https://mainnet.base.org';

// ERC20 ABI（只需要 balanceOf 函数）
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
];

async function checkBalance() {
    console.log('🔍 验证地址余额...\n');
    console.log(`合约地址: ${CLANKER_CONTRACT}`);
    console.log(`查询地址: ${ADDRESS_TO_CHECK}\n`);

    // 连接到 Base 链
    const provider = new ethers.JsonRpcProvider(BASE_RPC);

    // 创建合约实例
    const token = new ethers.Contract(CLANKER_CONTRACT, ERC20_ABI, provider);

    try {
        // 获取代币信息
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();

        console.log('代币信息:');
        console.log(`  名称: ${name}`);
        console.log(`  符号: ${symbol}`);
        console.log(`  精度: ${decimals}`);
        console.log(`  总供应量: ${ethers.formatUnits(totalSupply, decimals)} tokens\n`);

        // 查询地址余额
        const balance = await token.balanceOf(ADDRESS_TO_CHECK);
        const balanceFormatted = ethers.formatUnits(balance, decimals);

        console.log('查询结果:');
        console.log(`  原始余额: ${balance.toString()}`);
        console.log(`  格式化余额: ${balanceFormatted} tokens`);
        console.log(`  是否为0: ${balance.toString() === '0'}`);

        if (balance.toString() === '0') {
            console.log('\n✅ 确认：该地址没有 clanker 代币');
        } else {
            console.log('\n⚠️ 该地址持有 clanker 代币');
        }

        // 计算占比
        const balanceBig = balance;
        const totalSupplyBig = totalSupply;
        const percentage = (balanceBig * 10000n / totalSupplyBig) / 100n;

        console.log(`  占比: ${percentage.toString()}%`);

    } catch (error) {
        console.error('❌ 错误:', error.message);
    }
}

checkBalance();
