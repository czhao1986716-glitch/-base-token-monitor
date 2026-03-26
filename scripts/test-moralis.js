// 测试 Moralis API Key
const https = require('https');

// 从截图中看到的，用户可能有多个 Key
// 让我们测试不同的端点

// 新的 API Key（用户提供）
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImRmYTE0NGZmLWMzOGQtNDYwZS1iMTM5LWEwNzg2MWQ4YTE0MCIsIm9yZ0lkIjoiNTA3MDgwIiwidXNlcklkIjoiNTIxNzUzIiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiI0YWQ4MDljOC02MzFiLTRlZjMtYWRjZi03NTczMGVhNjUwMzYiLCJpYXQiOjE3NzQ0ODk0NzIsImV4cCI6NDkzMDI0OTQ3Mn0.r3JzYFWeMMfuuZVbxTlJqeLI43ofkal7TKR8aSl4a9Y';

const CONTRACT_ADDRESS = '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb';

console.log('🔍 测试 Moralis API Key...\n');

// 测试1：获取 ERC20 代币持有者（使用正确的端点格式）
console.log('测试1：获取 ERC20 代币持有者');
const url1 = `https://deep-index.moralis.io/api/v2.2/erc20/${CONTRACT_ADDRESS}/owners?chain=base&limit=10`;

https.get(url1, {
    headers: {
        'accept': 'application/json',
        'X-API-Key': API_KEY
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);

        if (res.statusCode === 200) {
            const response = JSON.parse(data);
            console.log('✅ API Key 有效！');
            console.log(`结果: ${JSON.stringify(response, null, 2).substring(0, 500)}...`);
        } else {
            console.log('❌ API Key 无效或权限不足');
            console.log(`错误: ${data}`);
        }
    });
}).on('error', (err) => {
    console.error('❌ 请求失败:', err.message);
});

// 测试2：尝试获取代币元数据
console.log('\n测试2：获取代币元数据');
const url2 = `https://deep-index.moralis.io/api/v2.2/${CONTRACT_ADDRESS}?chain=base`;

https.get(url2, {
    headers: {
        'accept': 'application/json',
        'X-API-Key': API_KEY
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);

        if (res.statusCode === 200) {
            const response = JSON.parse(data);
            console.log('✅ 获取到代币信息');
            console.log(`代币名称: ${response.name}`);
            console.log(`代币符号: ${response.symbol}`);
        } else {
            console.log(`响应: ${data.substring(0, 200)}...`);
        }
    });
});
