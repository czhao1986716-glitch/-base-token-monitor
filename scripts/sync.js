// ===================================
// Base Token Monitor - 数据同步脚本（真实数据版本）
// ===================================
// 功能：从 Moralis API 获取真实的代币持币数据
// 数据源：Moralis API v2.2

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const fs = require('fs');
const https = require('https');

// 配置
const TOKENS_CONFIG = require('../tokens-config.json');
const DATA_DIR = path.join(__dirname, '../data');

// Moralis API Key（从环境变量或硬编码）
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImRmYTE0NGZmLWMzOGQtNDYwZS1iMTM5LWEwNzg2MWQ4YTE0MCIsIm9yZ0lkIjoiNTA3MDgwIiwidXNlcklkIjoiNTIxNzUzIiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiI0YWQ4MDljOC02MzFiLTRlZjMtYWRjZi03NTczMGVhNjUwMzYiLCJpYXQiOjE3NzQ0ODk0NzIsImV4cCI6NDkzMDI0OTQ3Mn0.r3JzYFWeMMfuuZVbxTlJqeLI43ofkal7TKR8aSl4a9Y';

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 主函数
async function main() {
    console.log('🚀 开始同步代币数据...');
    console.log(`数据源: Moralis API (Base 链)`);
    console.log(`监控代币数量: ${TOKENS_CONFIG.length}\n`);

    for (const token of TOKENS_CONFIG) {
        console.log(`📊 处理代币: ${token.name} (${token.symbol})`);
        await syncTokenData(token);
    }

    console.log('\n✅ 数据同步完成！');
    console.log(`数据保存位置: ${DATA_DIR}`);
}

// 同步单个代币的数据
async function syncTokenData(token) {
    try {
        console.log(`  正在从 Moralis API 获取数据...`);

        // 从 Moralis API 获取持有者数据
        const moralisHolders = await getHoldersFromMoralis(token.address);

        if (!moralisHolders || moralisHolders.length === 0) {
            console.log(`  ⚠️  未获取到持有者数据`);
            return;
        }

        console.log(`  ✓ 获取到 ${moralisHolders.length} 个持有者地址`);

        // 转换数据格式（Moralis API 格式 -> 前端期望格式）
        const holders = transformHoldersData(moralisHolders);
        console.log(`  ✓ 转换数据格式`);

        // 计算统计数据
        const stats = calculateStats(token, holders);
        console.log(`  ✓ 计算统计数据`);

        // 生成预警
        const alerts = generateAlerts(holders, stats);
        console.log(`  ✓ 生成 ${alerts.length} 条预警`);

        // 保存统计数据
        const statsPath = path.join(DATA_DIR, `${token.symbol}-stats.json`);
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
        console.log(`  ✓ 统计数据已保存: ${token.symbol}-stats.json`);

        // 保存持币数据
        const holdersPath = path.join(DATA_DIR, `${token.symbol}-holders.json`);
        fs.writeFileSync(holdersPath, JSON.stringify(holders, null, 2));
        console.log(`  ✓ 持币数据已保存: ${token.symbol}-holders.json`);

        // 保存预警数据
        const alertsPath = path.join(DATA_DIR, `${token.symbol}-alerts.json`);
        fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));
        console.log(`  ✓ 预警数据已保存: ${token.symbol}-alerts.json`);

    } catch (error) {
        console.error(`  ❌ 错误: ${error.message}`);
    }
}

// 转换持有者数据格式（Moralis API -> 前端格式）
function transformHoldersData(moralisHolders) {
    return moralisHolders.map((holder, index) => {
        const balance = parseFloat(holder.balance_formatted || 0);
        const percentage = parseFloat(holder.percentage_relative_to_total_supply || 0);

        return {
            rank: index + 1,
            address: holder.owner_address,
            balance: balance.toFixed(2),
            percentage: percentage.toFixed(4),
            change_24h: 0, // 暂时设为 0，需要历史数据才能计算
            // 保留原始数据以备将来使用
            raw_data: {
                balance: holder.balance,
                usd_value: holder.usd_value,
                is_contract: holder.is_contract,
                owner_address_label: holder.owner_address_label
            }
        };
    });
}

// 从 Moralis API 获取持有者数据（分页获取）
function getHoldersFromMoralis(contractAddress, cursor = null, allHolders = []) {
    let url = `https://deep-index.moralis.io/api/v2.2/erc20/${contractAddress}/owners?chain=base&limit=100`;

    if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
    }

    return new Promise((resolve, reject) => {
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
                    const holders = response.result || [];

                    allHolders = allHolders.concat(holders);

                    // 如果还有更多数据且未达到500，继续获取
                    if (response.cursor && allHolders.length < 500) {
                        // 等待200ms避免速率限制
                        setTimeout(() => {
                            getHoldersFromMoralis(contractAddress, response.cursor, allHolders)
                                .then(resolve)
                                .catch(reject);
                        }, 200);
                    } else {
                        resolve(allHolders);
                    }
                } else {
                    reject(new Error(`Moralis API Error: ${res.statusCode} - ${data}`));
                }
            });
        }).on('error', reject);
    });
}

// 计算统计数据
function calculateStats(token, holders) {
    // 计算总供应量（从已转换的数据中获取）
    const totalSupply = holders.reduce((sum, holder) => {
        return sum + parseFloat(holder.balance);
    }, 0);

    // 计算前10和前100的集中度
    const top10Balance = holders.slice(0, 10).reduce((sum, holder) => {
        return sum + parseFloat(holder.balance);
    }, 0);

    const top100Balance = holders.slice(0, Math.min(100, holders.length)).reduce((sum, holder) => {
        return sum + parseFloat(holder.balance);
    }, 0);

    const top10Concentration = (top10Balance / totalSupply * 100).toFixed(2);
    const top100Concentration = (top100Balance / totalSupply * 100).toFixed(2);

    return {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        total_holders: holders.length,
        total_supply: totalSupply.toFixed(2),
        top10_concentration: top10Concentration,
        top100_concentration: top100Concentration,
        last_update: new Date().toISOString()
    };
}

// 生成预警
function generateAlerts(holders, stats) {
    const alerts = [];
    const top10Concentration = parseFloat(stats.top10_concentration);
    const top100Concentration = parseFloat(stats.top100_concentration);

    // 1. 统计信息
    alerts.push({
        severity: 'low',
        message: `ℹ️ 当前共有 ${stats.total_holders} 个持币地址（数据来源：Moralis API）`,
        address: null,
        rank: null,
        amount: null,
        timestamp: new Date().toISOString()
    });

    // 2. 检查超大庄家（单个地址超过10%）
    const bigWhale = holders.find(h => parseFloat(h.percentage) > 10);
    if (bigWhale) {
        const percentage = parseFloat(bigWhale.percentage).toFixed(2);
        alerts.push({
            severity: 'high',
            message: `🔴 超大庄家地址：#1 地址持有 ${percentage}% 的代币`,
            address: bigWhale.address,
            rank: bigWhale.rank,
            amount: parseFloat(bigWhale.balance),
            timestamp: new Date().toISOString()
        });
    }

    // 3. 检查前10高度集中
    if (top10Concentration > 50) {
        alerts.push({
            severity: 'high',
            message: `⚠️ 高度集中：前10地址持有 ${top10Concentration}% 的代币，流动性高度集中`,
            address: holders[0]?.address || null,
            rank: holders[0]?.rank || null,
            amount: parseFloat(holders[0]?.balance || 0),
            timestamp: new Date().toISOString()
        });
    }

    // 4. 检查前100集中度
    if (top100Concentration > 80) {
        alerts.push({
            severity: 'medium',
            message: `📊 前100地址集中度：${top100Concentration}%，流动性较为集中`,
            address: holders[0]?.address || null,
            rank: holders[0]?.rank || null,
            amount: parseFloat(holders[0]?.balance || 0),
            timestamp: new Date().toISOString()
        });
    }

    // 5. 检查合约地址
    const contractHolders = holders.filter(h => h.raw_data?.is_contract);
    if (contractHolders.length > 0) {
        alerts.push({
            severity: 'low',
            message: `📝 前500地址中有 ${contractHolders.length} 个合约地址`,
            address: null,
            rank: null,
            amount: null,
            timestamp: new Date().toISOString()
        });
    }

    return alerts;
}

// 运行主函数
main().catch(error => {
    console.error('❌ 发生错误:', error);
    process.exit(1);
});
