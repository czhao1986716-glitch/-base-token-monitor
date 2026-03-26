// ===================================
// Base Token Monitor - 数据同步脚本（模拟数据版本）
// ===================================
// 功能：生成真实的模拟代币持币数据
// 说明：由于 BaseScan V1 API 已废弃，当前使用模拟数据
//       数据格式与真实数据完全一致，方便之后切换到真实数据源

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const fs = require('fs');

// 配置
const TOKENS_CONFIG = require('../tokens-config.json');
const DATA_DIR = path.join(__dirname, '../data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 主函数
async function main() {
    console.log('🚀 开始生成代币模拟数据...');
    console.log(`数据源: 模拟数据（演示版本）`);
    console.log(`监控代币数量: ${TOKENS_CONFIG.length}\n`);

    for (const token of TOKENS_CONFIG) {
        console.log(`📊 处理代币: ${token.name} (${token.symbol})`);
        await syncTokenData(token);
    }

    console.log('\n✅ 数据生成完成！');
    console.log('\n💡 提示：当前使用模拟数据用于演示。');
    console.log('   如需接入真实数据，请修改 scripts/sync.js 中的数据源配置。');
}

// 同步单个代币的数据
async function syncTokenData(token) {
    try {
        console.log(`  正在生成模拟数据...`);

        // 生成模拟数据
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
        console.log(`  ✓ 预警数据已保存: ${token.symbol}-alerts.json (${mockData.alerts.length} 条预警)\n`);

    } catch (error) {
        console.error(`  ✗ 生成失败: ${error.message}\n`);
        throw error;
    }
}

// 生成真实的模拟数据
function generateMockData(token) {
    // 总供应量：1亿代币
    const totalSupply = 100000000;

    // 生成前500持币地址
    const holders = [];

    for (let i = 1; i <= 500; i++) {
        let balance;

        // 前10地址：持有较大比例（模拟大户）
        if (i <= 10) {
            // 第1名持有最多，逐渐减少
            const basePercentage = 0.15 - (i - 1) * 0.01; // 15% -> 5%
            balance = totalSupply * basePercentage + (Math.random() * totalSupply * 0.01);
        }
        // 前100地址：中等比例
        else if (i <= 100) {
            const basePercentage = 0.04 - (i - 10) * 0.0003; // 4% -> 0.1%
            balance = totalSupply * basePercentage + (Math.random() * totalSupply * 0.001);
        }
        // 其他地址：较小比例
        else {
            const basePercentage = 0.001 - (i - 100) * 0.000001; // 0.1% -> 0.0001%
            balance = totalSupply * basePercentage + (Math.random() * totalSupply * 0.0001);
        }

        // 确保余额为正数
        balance = Math.max(balance, 1000);

        const percentage = (balance / totalSupply) * 100;

        // 生成24h变化（前50名变化较大）
        let change24h;
        if (i <= 50) {
            change24h = (Math.random() - 0.5) * 10; // -5% 到 +5%
        } else {
            change24h = (Math.random() - 0.5) * 2; // -1% 到 +1%
        }

        holders.push({
            rank: i,
            address: generateRealisticAddress(),
            balance: balance.toFixed(2),
            percentage: percentage.toFixed(4),
            change_24h: parseFloat(change24h.toFixed(2))
        });
    }

    // 计算集中度
    const top10Balance = holders.slice(0, 10).reduce((sum, h) => sum + parseFloat(h.balance), 0);
    const top100Balance = holders.slice(0, 100).reduce((sum, h) => sum + parseFloat(h.balance), 0);

    // 计算实际的总供应量（基于所有持币者的余额）
    const actualTotalSupply = holders.reduce((sum, h) => sum + parseFloat(h.balance), 0);

    // 生成统计数据
    const stats = {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        total_holders: holders.length,
        total_supply: actualTotalSupply.toFixed(2),
        top10_concentration: ((top10Balance / actualTotalSupply) * 100).toFixed(2),
        top100_concentration: ((top100Balance / actualTotalSupply) * 100).toFixed(2),
        last_update: new Date().toISOString()
    };

    // 生成预警
    const alerts = generateAlerts(holders, stats);

    return {
        stats,
        holders,
        alerts
    };
}

// 生成真实的 Base 地址
function generateRealisticAddress() {
    const chars = '0123456789abcdef';
    let address = '0x';

    for (let i = 0; i < 40; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }

    return address;
}

// 生成预警
function generateAlerts(holders, stats) {
    const alerts = [];
    const top10Concentration = parseFloat(stats.top10_concentration);
    const top100Concentration = parseFloat(stats.top100_concentration);

    // 高度集中预警
    if (top10Concentration > 50) {
        alerts.push({
            severity: 'high',
            message: `⚠️ 前10地址高度集中：${top10Concentration.toFixed(2)}%，需注意大户抛压风险`,
            address: holders[0].address,
            rank: 1,
            amount: parseFloat(holders[0].balance),
            timestamp: new Date().toISOString()
        });
    }

    // 超大庄家预警
    const largestHolder = holders[0];
    if (parseFloat(largestHolder.percentage) > 10) {
        alerts.push({
            severity: 'high',
            message: `🔴 超大庄家地址：#1 地址持有 ${largestHolder.percentage}% 的代币`,
            address: largestHolder.address,
            rank: 1,
            amount: parseFloat(largestHolder.balance),
            timestamp: new Date(Date.now() - 3600000).toISOString()
        });
    }

    // 大户变动预警（模拟24h内的变化）
    const changingHolder = holders[Math.floor(Math.random() * 10) + 1];
    const isSell = Math.random() > 0.5;
    const amount = Math.random() * 5 + 1; // 1-6M

    alerts.push({
        severity: 'medium',
        message: `${isSell ? '📉' : '📈'} 大户变动：#${changingHolder.rank} 地址${isSell ? '卖出' : '买入'} ${amount.toFixed(2)}M 代币`,
        address: changingHolder.address,
        rank: changingHolder.rank,
        amount: isSell ? -amount : amount,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
    });

    // 集中度预警
    if (top100Concentration > 80) {
        alerts.push({
            severity: 'medium',
            message: `📊 前100地址集中度：${top100Concentration.toFixed(2)}%，流动性较为集中`,
            address: holders[0].address,
            rank: 1,
            amount: parseFloat(holders[0].balance),
            timestamp: new Date(Date.now() - 7200000).toISOString()
        });
    }

    // 统计信息
    alerts.push({
        severity: 'low',
        message: `ℹ️ 当前共有 ${holders.length} 个持币地址（模拟数据）`,
        address: null,
        rank: null,
        amount: null,
        timestamp: new Date().toISOString()
    });

    // 按时间排序
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return alerts;
}

// 运行主函数
main().catch(error => {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
});
