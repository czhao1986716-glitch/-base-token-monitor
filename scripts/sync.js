// ===================================
// Base Token Monitor - 数据同步脚本（真实数据版本）
// ===================================
// 功能：从 Base 链获取代币持币数据，生成 JSON 文件
// 数据源：Moralis API

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || '';
const TOKENS_CONFIG = require('../tokens-config.json');
const DATA_DIR = path.join(__dirname, '../data');

// Moralis API 配置
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 主函数
async function main() {
    console.log('🚀 开始同步代币数据...');
    console.log(`数据源: Moralis API`);

    if (!MORALIS_API_KEY) {
        console.error('❌ 错误: 未找到 MORALIS_API_KEY 环境变量');
        console.error('\n请按以下步骤获取 API Key:');
        console.error('1. 访问 https://admin.moralis.io/register');
        console.error('2. 注册并创建免费账户');
        console.error('3. 创建新的 API Key');
        console.error('4. 在 GitHub Secrets 中添加 MORALIS_API_KEY');
        console.error('5. 或在本地 .env 文件中添加 MORALIS_API_KEY=your_key_here');
        process.exit(1);
    }

    console.log(`监控代币数量: ${TOKENS_CONFIG.length}\n`);

    for (const token of TOKENS_CONFIG) {
        console.log(`📊 处理代币: ${token.name} (${token.symbol})`);
        await syncTokenData(token);
    }

    console.log('\n✅ 数据同步完成！');
}

// 同步单个代币的数据
async function syncTokenData(token) {
    try {
        console.log(`  正在从 Moralis API 获取数据...`);

        // 获取真实的持币数据
        const realData = await getRealTokenData(token);

        // 保存统计数据
        const statsPath = path.join(DATA_DIR, `${token.symbol}-stats.json`);
        fs.writeFileSync(statsPath, JSON.stringify(realData.stats, null, 2));
        console.log(`  ✓ 统计数据已保存: ${token.symbol}-stats.json`);

        // 保存持币数据
        const holdersPath = path.join(DATA_DIR, `${token.symbol}-holders.json`);
        fs.writeFileSync(holdersPath, JSON.stringify(realData.holders, null, 2));
        console.log(`  ✓ 持币数据已保存: ${token.symbol}-holders.json (${realData.holders.length} 条记录)`);

        // 保存预警数据
        const alertsPath = path.join(DATA_DIR, `${token.symbol}-alerts.json`);
        fs.writeFileSync(alertsPath, JSON.stringify(realData.alerts, null, 2));
        console.log(`  ✓ 预警数据已保存: ${token.symbol}-alerts.json (${realData.alerts.length} 条预警)`);

    } catch (error) {
        console.error(`  ✗ 同步失败: ${error.message}`);
        throw error;
    }
}

// 从 Moralis API 获取真实数据
async function getRealTokenData(token) {
    try {
        // 获取前500持币地址
        const holders = await fetchTopHolders(token.address, 500);

        if (!holders || holders.length === 0) {
            throw new Error('未获取到持币数据');
        }

        // 计算总供应量（基于持币数据）
        const totalSupply = holders.reduce((sum, h) => sum + parseFloat(h.balance), 0);

        // 计算集中度
        const top10Balance = holders.slice(0, 10).reduce((sum, h) => sum + parseFloat(h.balance), 0);
        const top100Balance = holders.slice(0, 100).reduce((sum, h) => sum + parseFloat(h.balance), 0);

        // 生成统计数据
        const stats = {
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            total_holders: holders.length,
            total_supply: totalSupply.toFixed(2),
            top10_concentration: ((top10Balance / totalSupply) * 100).toFixed(2),
            top100_concentration: ((top100Balance / totalSupply) * 100).toFixed(2),
            last_update: new Date().toISOString()
        };

        // 添加百分比到持币数据
        const holdersWithPercentage = holders.map((holder, index) => ({
            rank: index + 1,
            address: holder.owner_address,
            balance: holder.balance,
            percentage: ((parseFloat(holder.balance) / totalSupply) * 100).toFixed(4),
            change_24h: 0 // Moralis 免费版不提供历史数据对比
        }));

        // 生成预警（基于大户持仓）
        const alerts = generateAlerts(holdersWithPercentage);

        return {
            stats,
            holders: holdersWithPercentage,
            alerts
        };

    } catch (error) {
        console.error(`获取真实数据失败: ${error.message}`);
        throw error;
    }
}

// 从 Moralis API 获取前N大持币地址
async function fetchTopHolders(tokenAddress, limit) {
    return new Promise((resolve, reject) => {
        const url = `${MORALIS_BASE_URL}/erc20/${tokenAddress}/owners?chain=base&order=DESC&limit=${limit}`;

        https.get(url, {
            headers: {
                'accept': 'application/json',
                'X-API-Key': MORALIS_API_KEY
            }
        }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (response.error) {
                        reject(new Error(response.error.message));
                        return;
                    }

                    if (response.result && Array.isArray(response.result)) {
                        // 过滤掉零余额地址
                        const holders = response.result
                            .filter(h => parseFloat(h.balance) > 0)
                            .map(h => ({
                                owner_address: h.owner_address,
                                balance: (parseFloat(h.balance) / Math.pow(10, 18)).toFixed(2), // 转换为代币数量
                                percentage: 0 // 稍后计算
                            }));

                        console.log(`  获取到 ${holders.length} 个持币地址`);
                        resolve(holders);
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    reject(new Error(`解析响应失败: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`API 请求失败: ${error.message}`));
        });
    });
}

// 生成预警（基于实际持仓数据）
function generateAlerts(holders) {
    const alerts = [];
    const topHolders = holders.slice(0, 100);

    // 检查前10大户的集中度
    const top10Concentration = holders.slice(0, 10).reduce((sum, h) => sum + parseFloat(h.percentage), 0);

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

    // 检查单个大户持仓比例
    const largestHolder = holders[0];
    if (parseFloat(largestHolder.percentage) > 10) {
        alerts.push({
            severity: 'high',
            message: `🔴 超大庄家地址：#1 地址持有 ${largestHolder.percentage}% 的代币`,
            address: largestHolder.address,
            rank: 1,
            amount: parseFloat(largestHolder.balance),
            timestamp: new Date().toISOString()
        });
    }

    // 检查前100地址集中度
    const top100Concentration = holders.slice(0, 100).reduce((sum, h) => sum + parseFloat(h.percentage), 0);

    if (top100Concentration > 80) {
        alerts.push({
            severity: 'medium',
            message: `📊 前100地址集中度：${top100Concentration.toFixed(2)}%，流动性较为集中`,
            address: holders[0].address,
            rank: 1,
            amount: parseFloat(holders[0].balance),
            timestamp: new Date().toISOString()
        });
    }

    // 添加常规信息
    alerts.push({
        severity: 'low',
        message: `ℹ️ 当前共有 ${holders.length} 个持币地址`,
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
