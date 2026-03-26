// ===================================
// Base Token Monitor - 数据同步脚本
// ===================================
// 功能：从 Base 链获取代币持币数据，生成 JSON 文件

const fs = require('fs');
const path = require('path');

// 配置
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const TOKENS_CONFIG = require('../tokens-config.json');
const DATA_DIR = path.join(__dirname, '../data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 主函数
async function main() {
    console.log('🚀 开始同步代币数据...');
    console.log(`RPC: ${RPC_URL}`);
    console.log(`监控代币数量: ${TOKENS_CONFIG.length}`);

    for (const token of TOKENS_CONFIG) {
        console.log(`\n📊 处理代币: ${token.name} (${token.symbol})`);
        await syncTokenData(token);
    }

    console.log('\n✅ 数据同步完成！');
}

// 同步单个代币的数据
async function syncTokenData(token) {
    try {
        // TODO: 接入真实的 Base 链数据
        // 当前使用模拟数据用于演示

        const mockData = generateMockData(token);

        // 保存统计数据
        const statsPath = path.join(DATA_DIR, `${token.symbol}-stats.json`);
        fs.writeFileSync(statsPath, JSON.stringify(mockData.stats, null, 2));
        console.log(`  ✓ 统计数据已保存: ${token.symbol}-stats.json`);

        // 保存持币数据
        const holdersPath = path.join(DATA_DIR, `${token.symbol}-holders.json`);
        fs.writeFileSync(holdersPath, JSON.stringify(mockData.holders, null, 2));
        console.log(`  ✓ 持币数据已保存: ${token.symbol}-holders.json (${mockData.holders.length} 条记录)`);

        // 保存预警数据
        const alertsPath = path.join(DATA_DIR, `${token.symbol}-alerts.json`);
        fs.writeFileSync(alertsPath, JSON.stringify(mockData.alerts, null, 2));
        console.log(`  ✓ 预警数据已保存: ${token.symbol}-alerts.json (${mockData.alerts.length} 条预警)`);

    } catch (error) {
        console.error(`  ✗ 同步失败: ${error.message}`);
        throw error;
    }
}

// 生成模拟数据（用于演示）
// TODO: 替换为真实的链上数据获取逻辑
function generateMockData(token) {
    const totalSupply = 1000000000; // 10亿代币
    const totalHolders = Math.floor(Math.random() * 500) + 1000;

    // 生成前500持币地址
    const holders = [];
    for (let i = 1; i <= 500; i++) {
        let balance;

        // 前10地址：持有较大比例
        if (i <= 10) {
            balance = totalSupply * 0.05 + Math.random() * totalSupply * 0.02;
        }
        // 前100地址：中等比例
        else if (i <= 100) {
            balance = totalSupply * 0.001 + Math.random() * totalSupply * 0.002;
        }
        // 其他地址：较小比例
        else {
            balance = totalSupply * 0.0001 + Math.random() * totalSupply * 0.0005;
        }

        const percentage = (balance / totalSupply) * 100;
        const change24h = (Math.random() - 0.5) * 10; // -5% 到 +5%

        holders.push({
            rank: i,
            address: generateRandomAddress(),
            balance: balance.toFixed(2),
            percentage: percentage.toFixed(4),
            change_24h: parseFloat(change24h.toFixed(2))
        });
    }

    // 计算集中度
    const top10Balance = holders.slice(0, 10).reduce((sum, h) => sum + parseFloat(h.balance), 0);
    const top100Balance = holders.slice(0, 100).reduce((sum, h) => sum + parseFloat(h.balance), 0);

    const stats = {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        total_holders: totalHolders,
        top10_concentration: ((top10Balance / totalSupply) * 100).toFixed(2),
        top100_concentration: ((top100Balance / totalSupply) * 100).toFixed(2),
        last_update: new Date().toISOString()
    };

    // 生成模拟预警
    const alerts = generateMockAlerts(holders);

    return {
        stats,
        holders,
        alerts
    };
}

// 生成模拟预警数据
function generateMockAlerts(holders) {
    const alerts = [];
    const topHolders = holders.slice(0, 100);

    // 随机生成 3-8 个预警
    const alertCount = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < alertCount; i++) {
        const holder = topHolders[Math.floor(Math.random() * topHolders.length)];
        const isSell = Math.random() > 0.5;
        const severity = Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low');

        const messages = {
            high: isSell
                ? `🔴 大额卖出：#${holder.rank} 地址卖出 ${(Math.random() * 5 + 1).toFixed(2)}M 代币`
                : `🔴 大额买入：#${holder.rank} 地址买入 ${(Math.random() * 5 + 1).toFixed(2)}M 代币`,
            medium: isSell
                ? `🟡 中等卖出：#${holder.rank} 地址卖出 ${(Math.random() * 2 + 0.5).toFixed(2)}M 代币`
                : `🟡 中等买入：#${holder.rank} 地址买入 ${(Math.random() * 2 + 0.5).toFixed(2)}M 代币`,
            low: isSell
                ? `🟢 小额变动：#${holder.rank} 地址持仓变化 ${holder.change_24h.toFixed(2)}%`
                : `🟢 小额变动：#${holder.rank} 地址持仓变化 ${holder.change_24h.toFixed(2)}%`
        };

        alerts.push({
            severity,
            message: messages[severity],
            address: holder.address,
            rank: holder.rank,
            amount: isSell ? -(Math.random() * 5 + 1) : (Math.random() * 5 + 1),
            timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString() // 最近24小时内
        });
    }

    // 按时间排序
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return alerts;
}

// 生成随机地址
function generateRandomAddress() {
    const chars = '0123456789abcdef';
    let address = '0x';

    for (let i = 0; i < 40; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }

    return address;
}

// 运行主函数
main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
});
