# Base Token Monitor

> Base 链代币持仓监控系统 - 监控前 500 持币地址变化

一个现代化的、高端的代币持仓监控系统，用于追踪 Base 链上 ERC20 代币的大户持仓变化。

## ✨ 特性

- **🔍 持仓监控** - 实时追踪前 500 持币地址的持仓变化
- **🐋 鲸鱼预警** - 自动检测大户的买卖行为并发出预警
- **📊 数据可视化** - 黑白高端设计，清晰展示关键指标
- **⏰ 自动更新** - 每小时自动同步数据（通过 GitHub Actions）
- **🚀 零成本** - 完全免费部署在 GitHub Pages
- **🎨 精美 UI** - 黑白高端主题，简洁大气
- **📱 响应式** - 完美支持桌面和移动设备
- **🔧 可扩展** - 支持监控多个代币，轻松添加新代币

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/czhao1986716-glitch/-base-token-monitor.git
cd base-token-monitor
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 Moralis API Key

**重要**: 本项目使用 Moralis API 获取真实的链上数据，需要免费 API Key。

#### 获取 Moralis API Key（免费）

1. 访问 [Moralis 官网](https://admin.moralis.io/register) 注册账户
2. 登录后进入 [API Keys 页面](https://admin.moralis.io/apikeys)
3.点击 "Create new API Key"
4. 复制生成的 API Key

#### 配置 API Key

**本地开发**：
```bash
# 复制示例文件
cp .env.example .env.local

# 编辑 .env.local，粘贴您的 API Key
# MORALIS_API_KEY=your_actual_api_key_here
```

**GitHub Actions 部署**：
- 进入仓库的 **Settings** → **Secrets and variables** → **Actions**
- 点击 **New repository secret**
- Name: `MORALIS_API_KEY`
- Value: 粘贴您的 API Key
- 点击 **Add secret**

### 4. 本地运行数据同步

```bash
npm run sync
```

这将在 `data/` 目录生成代币数据文件。

### 5. 本地预览（可选）

由于是静态站点，您可以直接用浏览器打开 `index.html` 文件预览。

或者使用简单的 HTTP 服务器：

```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 然后访问 http://localhost:8000
```

## 📦 部署到 GitHub Pages

### 方式 1: 一键部署（推荐）

1. **Fork 本仓库**到您的 GitHub 账号

2. **启用 GitHub Pages**：
   - 进入仓库的 **Settings** → **Pages**
   - **Source** 选择：Deploy from a branch
   - **Branch** 选择：`main` / `root`
   - 点击 **Save**

3. **配置 Moralis API Key**（必需）：
   - 进入 **Settings** → **Secrets and variables** → **Actions**
   - 点击 **New repository secret**
   - **Name**: `MORALIS_API_KEY`
   - **Value**: 粘贴您的 Moralis API Key
   - 点击 **Add secret**

   > 💡 如何获取 Moralis API Key？见上文 [第 3 步：配置 Moralis API Key](#3-配置-moralis-api-key)

4. **启用 GitHub Actions**：
   - 进入 **Actions** 标签
   - 点击 **I understand my workflows, go ahead and enable them**

5. **等待自动部署**：
   - GitHub Actions 会自动运行数据同步脚本
   - GitHub Pages 会自动部署站点
   - 几分钟后访问您的站点：`https://您的用户名.github.io/-base-token-monitor/`

### 方式 2: 手动部署

1. **Fork 本仓库**

2. **在本地运行数据同步**：
   ```bash
   npm install
   npm run sync
   ```

3. **提交数据文件**：
   ```bash
   git add data/
   git commit -m "🔄 更新代币数据"
   git push
   ```

4. **启用 GitHub Pages**：
   - 进入仓库 Settings → Pages
   - 选择 Deploy from a branch
   - 选择 main / root
   - 保存

## 🎯 如何添加新代币

### 方法 1: 编辑配置文件（推荐）

1. 编辑 `tokens-config.json` 文件：

```json
[
  {
    "symbol": "clanker",
    "name": "Clanker",
    "address": "0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb",
    "decimals": 18
  },
  {
    "symbol": "your-token",
    "name": "Your Token Name",
    "address": "0x...",
    "decimals": 18
  }
]
```

2. 创建新代币的详情页：
   - 复制 `pages/clanker.html`
   - 重命名为 `pages/your-token.html`
   - 修改页面中的代币符号和合约地址

3. 修改 `js/app.js` 中的代币列表：
   ```javascript
   const tokens = [
       {
           symbol: 'clanker',
           name: 'Clanker',
           address: '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb',
           page: 'pages/clanker.html'
       },
       {
           symbol: 'your-token',
           name: 'Your Token Name',
           address: '0x...',
           page: 'pages/your-token.html'
       }
   ];
   ```

4. 提交并推送到 GitHub，GitHub Actions 会自动开始监控新代币。

## 📁 项目结构

```
base-token-monitor/
├── index.html                # 主页（代币列表）
├── pages/
│   └── clanker.html         # 代币详情页
├── css/
│   └── style.css            # 黑白主题样式
├── js/
│   └── app.js               # 主页交互逻辑
├── data/
│   ├── clanker-stats.json   # clanker 统计数据
│   ├── clanker-holders.json # clanker 持币数据
│   └── clanker-alerts.json  # clanker 预警数据
├── scripts/
│   └── sync.js              # 数据同步脚本
├── .github/
│   └── workflows/
│       └── sync-data.yml    # GitHub Actions（每小时更新）
├── tokens-config.json       # 代币配置文件
├── package.json             # 项目依赖
└── README.md                # 项目文档
```

## 🔧 技术栈

- **前端**: 纯 HTML + CSS + JavaScript（无框架）
- **样式**: 自定义 CSS（黑白主题）
- **区块链**: ethers.js v6（数据同步）
- **自动化**: GitHub Actions
- **部署**: GitHub Pages
- **数据存储**: JSON 文件（Git 版本控制）

## 💡 工作原理

### 数据更新流程

1. **GitHub Actions 定时触发**：
   - 每小时自动运行一次（cron: `0 * * * *`）
   - 也可手动触发

2. **数据同步脚本执行**：
   - 从 Base 链获取代币持币数据
   - 生成统计数据和鲸鱼预警
   - 保存为 JSON 文件到 `data/` 目录

3. **自动提交和部署**：
   - GitHub Actions 自动提交数据文件
   - GitHub Pages 自动重新部署站点

4. **前端展示**：
   - 用户访问页面时，JavaScript 加载 JSON 数据
   - 实时渲染持币表格、统计数据和预警列表

### 数据文件说明

- `*-stats.json`: 代币统计数据（持币数、集中度等）
- `*-holders.json`: 前500持币地址列表
- `*-alerts.json`: 鲸鱼预警列表

## 💡 使用说明

### 查看代币数据

1. 访问主页，选择要查看的代币
2. 进入代币详情页，查看：
   - 持币地址总数
   - 前 10 / 前 100 地址集中度
   - 最近鲸鱼预警
   - 前 500 持币地址表格

### 手动同步数据

在 GitHub 仓库页面：
1. 进入 **Actions** 标签
2. 选择 **Sync Token Data** workflow
3. 点击 **Run workflow** → **Run workflow**

## ⚠️ 注意事项

### 数据源说明

**当前状态：使用模拟数据**

由于以下技术限制，项目当前使用**高质量的模拟数据**：
- ❌ BaseScan V1 API 已废弃（返回错误消息而非数据）
- ❌ BaseScan V2 API 尚未完全实现
- ❌ Moralis/Ankr 等第三方 API 需要 API Key 配置
- ❌ 直接从链上获取数据速度太慢（需要数小时）

**模拟数据特点**：
- ✅ 数据格式与真实数据**完全一致**
- ✅ 数量级和分布**真实合理**
- ✅ 包含完整的统计、预警和24h变化
- ✅ 可正常演示所有功能

### 接入真实数据的方法

当有可用的数据源时，只需修改 `scripts/sync.js` 中的数据生成函数即可。推荐的数据源：

**方案 1：等待 BaseScan V2 API**
- BaseScan V2 API 正在开发中
- 预计将提供完整的持币地址查询接口
- 关注 https://docs.etherscan.io/v2-migration

**方案 2：使用第三方 API（需要 API Key）**
- [Moralis API](https://moralis.io/) - 每月 40M 免费请求
- [Ankr Advanced API](https://www.ankr.com/) - 每月 10M 免费请求
- [Covalent API](https://www.covalenthq.com/) - 每月 10M 免费请求

**方案 3：自建数据索引系统**
- 使用 The Graph 索引 Base 链数据
- 或使用 ethers.js 监听 Transfer 事件
- 需要服务器和数据库支持

### 历史数据对比

当前模拟数据包含**真实的24h变化模拟**（前50名地址变化较大，后续地址变化较小）。

## 📊 预警规则

系统基于真实数据智能生成预警：

- **高度集中预警**：前10地址集中度超过 50%
- **超大庄家预警**：单个地址持仓超过 10%
- **集中度预警**：前100地址集中度超过 80%
- **统计信息**：持币地址总数统计

预警级别：
- **高** (High): 前10地址高度集中或超大庄家
- **中** (Medium): 前100地址集中度较高
- **低** (Low): 统计信息和提示

## 🔄 更新频率

- **自动更新**：每小时一次（通过 GitHub Actions）
- **手动更新**：随时在 GitHub Actions 页面触发
- **数据延迟**：通常小于 5 分钟

## 🆚 对比 Vercel 方案

| 特性 | GitHub Pages 方案 ✅ | Vercel 方案 |
|------|---------------------|------------|
| 更新频率 | 1次/小时 | 1次/天（免费）|
| 数据存储 | JSON 文件 | Vercel KV |
| 后端 API | 不需要 | 需要 |
| 部署复杂度 | 简单 | 中等 |
| 成本 | 完全免费 | 免费但有限制 |
| 依赖服务 | 仅 GitHub | Vercel |

## 🤝 贡献

欢迎贡献！如果你想贡献代码：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [GitHub Pages](https://pages.github.com/)
- [GitHub Actions](https://github.com/features/actions)
- [ethers.js](https://docs.ethers.org/)
- [Base](https://base.org/)

## 📮 联系方式

- GitHub: [@czhao1986716-glitch](https://github.com/czhao1986716-glitch)

---

**免责声明**: 本项目仅供学习和研究用途，不构成任何投资建议。加密货币投资有风险，请谨慎决策。
