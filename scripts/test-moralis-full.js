// 测试 Moralis API - 获取完整数据
const https = require('https');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImRmYTE0NGZmLWMzOGQtNDYwZS1iMTM5LWEwNzg2MWQ4YTE0MCIsIm9yZ0lkIjoiNTA3MDgwIiwidXNlcklkIjoiNTIxNzUzIiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiI0YWQ4MDljOC02MzFiLTRlZjMtYWRjZi03NTczMGVhNjUwMzYiLCJpYXQiOjE3NzQ0ODk0NzIsImV4cCI6NDkzMDI0OTQ3Mn0.r3JzYFWeMMfuuZVbxTlJqeLI43ofkal7TKR8aSl4a9Y';

const CONTRACT_ADDRESS = '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb';

console.log('🔍 测试 Moralis API - 获取完整数据...\n');

// 获取所有持有者数据（分页获取）
function getOwners(cursor = null, allOwners = []) {
    let url = `https://deep-index.moralis.io/api/v2.2/erc20/${CONTRACT_ADDRESS}/owners?chain=base&limit=100`;

    if (cursor) {
        url += `&cursor=${cursor}`;
    }

    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'accept': 'application/json',
                'X-API-Key': API_KEY
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const response = JSON.parse(data);
                    console.log(`📊 获取到 ${response.result.length} 个持有者`);

                    allOwners = allOwners.concat(response.result);

                    if (response.cursor && allOwners.length < 500) {
                        console.log(`🔄 继续获取下一页...（当前: ${allOwners.length}）`);
                        // 等待一下避免速率限制
                        setTimeout(() => {
                            getOwners(response.cursor, allOwners).then(resolve);
                        }, 200);
                    } else {
                        console.log(`\n✅ 总共获取到 ${allOwners.length} 个持有者\n`);
                        resolve(allOwners);
                    }
                } else {
                    console.log(`❌ 错误: ${res.statusCode}`);
                    console.log(data);
                    reject(new Error(`API Error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// 获取代币元数据
function getTokenMetadata() {
    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${CONTRACT_ADDRESS}/metadata?chain=base`;

    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'accept': 'application/json',
                'X-API-Key': API_KEY
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`API Error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// 执行测试
async function main() {
    try {
        // 1. 获取持有者数据
        console.log('步骤1：获取持有者数据（前500）');
        const owners = await getOwners();

        // 2. 显示前10个持有者
        console.log('\n📋 前10个持有者：');
        console.log('排名\t地址\t\t\t\t\t\t持仓量（raw）\t精度');
        console.log('─'.repeat(100));

        owners.slice(0, 10).forEach((owner, index) => {
            console.log(
                `${index + 1}\t` +
                `${owner.owner_address.slice(0, 10)}...${owner.owner_address.slice(-8)}\t` +
                `${owner.balance}\t` +
                `18`
            );
        });

        // 3. 分析数据结构
        console.log('\n📊 数据结构分析：');
        console.log('第一个持有者的完整数据:');
        console.log(JSON.stringify(owners[0], null, 2));

        // 4. 计算集中度（假设精度为18）
        const decimals = 18;
        const totalSupply = owners.reduce((sum, owner) => {
            return sum + parseFloat(owner.balance);
        }, 0) / Math.pow(10, decimals);

        const top10Balance = owners.slice(0, 10).reduce((sum, owner) => {
            return sum + parseFloat(owner.balance);
        }, 0) / Math.pow(10, decimals);

        const top100Balance = owners.slice(0, Math.min(100, owners.length)).reduce((sum, owner) => {
            return sum + parseFloat(owner.balance);
        }, 0) / Math.pow(10, decimals);

        console.log('\n📊 统计数据：');
        console.log(`总持币地址数: ${owners.length}`);
        console.log(`总供应量: ${totalSupply.toFixed(2)}`);
        console.log(`前10地址集中度: ${(top10Balance / totalSupply * 100).toFixed(2)}%`);
        console.log(`前100地址集中度: ${(top100Balance / totalSupply * 100).toFixed(2)}%`);

    } catch (error) {
        console.error('❌ 错误:', error.message);
    }
}

main();
