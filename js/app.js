// ===================================
// Base Token Monitor - 主页逻辑
// ===================================

// 代币列表数据
const tokens = [
    {
        symbol: 'clanker',
        name: 'Clanker',
        address: '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb',
        page: 'pages/clanker.html'
    }
];

// 页面加载时执行
document.addEventListener('DOMContentLoaded', async () => {
    await renderTokens();
    await updateLastUpdateTime();
});

// 渲染代币列表
async function renderTokens() {
    const container = document.getElementById('tokensList');

    try {
        // 加载所有代币的统计数据
        const tokensWithData = await Promise.all(
            tokens.map(async (token) => {
                try {
                    const response = await fetch(`data/${token.symbol}-stats.json`);
                    const stats = await response.json();

                    return {
                        ...token,
                        stats: stats
                    };
                } catch (error) {
                    console.error(`加载 ${token.symbol} 数据失败:`, error);
                    return {
                        ...token,
                        stats: null
                    };
                }
            })
        );

        // 渲染代币卡片
        container.innerHTML = tokensWithData.map(token => {
            if (!token.stats) {
                return renderErrorCard(token);
            }

            return renderTokenCard(token);
        }).join('');

    } catch (error) {
        console.error('渲染代币列表失败:', error);
        container.innerHTML = '<div class="error">加载失败，请刷新页面重试</div>';
    }
}

// 渲染代币卡片
function renderTokenCard(token) {
    const stats = token.stats;
    const lastUpdate = formatTime(stats.last_update);

    return `
        <a href="${token.page}" class="token-card">
            <div class="token-card-header">
                <div class="token-card-title">${token.name}</div>
                <div class="token-card-symbol">${token.symbol.toUpperCase()}</div>
            </div>

            <div class="token-card-stats">
                <div class="token-card-stat">
                    <div class="token-card-stat-label">持币地址</div>
                    <div class="token-card-stat-value">${stats.total_holders.toLocaleString()}</div>
                </div>
                <div class="token-card-stat">
                    <div class="token-card-stat-label">前10占比</div>
                    <div class="token-card-stat-value">${stats.top10_concentration}%</div>
                </div>
            </div>

            <div class="token-card-footer">
                最后更新: ${lastUpdate}
            </div>
        </a>
    `;
}

// 渲染错误卡片
function renderErrorCard(token) {
    return `
        <a href="${token.page}" class="token-card">
            <div class="token-card-header">
                <div class="token-card-title">${token.name}</div>
                <div class="token-card-symbol">${token.symbol.toUpperCase()}</div>
            </div>

            <div class="token-card-stats">
                <div class="token-card-stat">
                    <div class="token-card-stat-label">状态</div>
                    <div class="token-card-stat-value text-muted">数据加载中...</div>
                </div>
            </div>

            <div class="token-card-footer">
                点击查看详情
            </div>
        </a>
    `;
}

// 更新最后更新时间
async function updateLastUpdateTime() {
    const element = document.getElementById('lastUpdate');

    try {
        // 尝试加载任意一个代币的统计数据
        const response = await fetch('data/clanker-stats.json');
        const stats = await response.json();

        element.textContent = formatTime(stats.last_update);
    } catch (error) {
        element.textContent = '未知';
    }
}

// 格式化时间
function formatTime(timestamp) {
    if (!timestamp) return '未知';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 秒

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;

    return date.toLocaleDateString('zh-CN');
}
