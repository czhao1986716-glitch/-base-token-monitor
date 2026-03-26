# Base Token Monitor

> Base 链代币持仓监控系统 - 监控前 500 持币地址变化

一个现代化的、高端的代币持仓监控系统，用于追踪 Base 链上 ERC20 代币的大户持仓变化。

## ✨ 特性

- **🔍 持仓监控** - 实时追踪前 500 持币地址的持仓变化
- **🐋 鲸鱼预警** - 自动检测大户的买卖行为并发出预警
- **📊 数据可视化** - 黑白高端设计，清晰展示关键指标
- **⏰ 自动更新** - 每小时自动同步数据（通过 Vercel Cron Jobs）
- **🚀 零成本** - 完全免费部署在 Vercel，无需服务器
- **🎨 精美 UI** - 基于 shadcn/ui 的高端黑白主题
- **📱 响应式** - 完美支持桌面和移动设备
- **🔧 可扩展** - 支持监控多个代币，轻松添加新代币

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/base-token-monitor.git
cd base-token-monitor
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env.local`：

```bash
cp .env.example .env.local
```

`.env.local` 内容：

```env
BASE_RPC_URL=https://mainnet.base.org
```

### 4. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 📦 部署到 Vercel

### 方式 1: 一键部署（推荐）

1. 点击下面的按钮一键部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fbase-token-monitor)

2. 在 Vercel 中：
   - 连接你的 GitHub 账号
   - Fork 这个仓库到你的账号
   - 导入项目并部署
   - Vercel 会自动创建并配置 KV 数据库

### 方式 2: 手动部署

1. Fork 本仓库到你的 GitHub 账号

2. 访问 [vercel.com](https://vercel.com) 并用 GitHub 登录

3. 点击 "New Project" 并选择你 fork 的仓库

4. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. 配置环境变量：
   ```
   BASE_RPC_URL=https://mainnet.base.org
   ```

6. 在 Vercel 项目设置中：
   - 进入 "Storage" 标签
   - 创建 "KV" 数据库
   - Vercel 会自动添加所需的环境变量

7. 点击 "Deploy"

8. 部署完成后，验证 Cron Jobs：
   - 在 Vercel 项目设置中找到 "Cron Jobs"
   - 确认 `/api/cron` 已配置为每天执行（免费账户限制）

### ⚠️ Vercel 免费账户限制

**Hobby（免费）账户限制**：
- ✅ Cron Jobs: **每天最多 1 次**（当前配置为每天凌晨 0 点执行）
- ✅ 手动同步：用户可随时点击"同步数据"按钮获取最新数据
- ✅ 前端自动刷新：每分钟自动刷新显示的数据

**如何获得更频繁的自动更新**：
1. **方式 1：升级 Vercel Pro 账户** ($20/月)
   - 解锁无限 Cron Jobs
   - 可以设置为每小时或更频繁

2. **方式 2：使用 GitHub Actions**（完全免费）
   - 创建 GitHub Workflow 定期触发同步
   - 可以设置为每小时或每 15 分钟
   - 具体配置方法见下文

3. **方式 3：手动同步**
   - 在代币详情页点击"同步数据"按钮
   - 或定时访问 `/api/cron` 端点

### 使用 GitHub Actions 实现每小时同步（免费）

1. 在项目根目录创建 `.github/workflows/sync.yml`：

```yaml
name: Sync Token Data

on:
  schedule:
    # 每小时执行一次（UTC 时间）
    - cron: '0 * * * *'
  workflow_dispatch: # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Cron
        run: |
          curl -X POST "https://你的项目地址.vercel.app/api/cron"
```

2. 提交并推送到 GitHub，Actions 会自动运行

## 🎯 如何添加新代币

编辑 `lib/tokens.ts` 文件：

```typescript
export const TOKENS: Token[] = [
  {
    symbol: 'clanker',
    name: 'Clanker',
    address: '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb',
    decimals: 18,
  },
  // 添加新代币...
  {
    symbol: 'your-token',
    name: 'Your Token Name',
    address: '0x...', // 代币合约地址
    decimals: 18,     // 代币精度
  },
]
```

提交并推送到 GitHub，Vercel 会自动重新部署。

## 📁 项目结构

```
base-token-monitor/
├── app/
│   ├── api/                # API 路由
│   │   ├── holders/        # 获取持币地址
│   │   ├── whale-alerts/   # 获取鲸鱼预警
│   │   ├── sync/           # 手动同步数据
│   │   └── cron/           # Cron Job 端点
│   ├── [token]/            # 代币详情页（动态路由）
│   ├── page.tsx            # 主页
│   ├── layout.tsx          # 根布局
│   └── globals.css         # 全局样式
├── components/
│   └── ui/                 # shadcn/ui 组件
├── lib/
│   ├── base.ts             # Base 链交互
│   ├── kv.ts               # Vercel KV 封装
│   ├── tokens.ts           # 代币配置
│   └── utils.ts            # 工具函数
├── types/
│   └── index.ts            # TypeScript 类型
├── public/                 # 静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── vercel.json             # Vercel 配置
```

## 🔧 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件**: shadcn/ui
- **图表**: Recharts
- **数据获取**: SWR
- **区块链**: ethers.js v6
- **存储**: Vercel KV (Redis)
- **部署**: Vercel

## 💡 使用说明

### 查看代币数据

1. 访问主页，选择要查看的代币
2. 进入代币详情页，查看：
   - 持币地址总数
   - 前 10 / 前 100 地址集中度
   - 最近鲸鱼预警
   - 前 500 持币地址列表

### 手动同步数据

在任何代币详情页，点击 "同步数据" 按钮，立即获取最新数据。

### 自动刷新

数据每分钟自动刷新一次，无需手动操作。

## ⚠️ 注意事项

1. **数据来源**：
   - 当前使用模拟数据用于演示
   - 生产环境需要接入真实的数据源（链上数据或第三方 API）

2. **获取真实数据**：
   - 方案 1：使用 [The Graph](https://thegraph.com/) 构建子图
   - 方案 2：使用第三方 API（如 DeBank、Arkham）
   - 方案 3：自行运行索引节点

3. **Vercel 限制**：
   - 免费套餐：每月 100GB 带宽
   - KV 免费额度：256MB 存储
   - 对于大多数使用场景，这些限制足够

4. **性能优化**：
   - 数据每小时自动同步，避免频繁的链上查询
   - 使用 KV 缓存减少 API 响应时间
   - 前端分页加载，提升用户体验

## 📊 预警规则

系统会在以下情况生成预警：

- 前 10 地址持仓变化超过 **5%**
- 前 100 地址持仓变化超过 **10%**
- 单次变化金额超过 **100 万代币**

预警级别：
- **高** (High): 前 10 大户的大额变动
- **中** (Medium): 前 100 大户的中等变动
- **低** (Low): 其他值得注意的变化

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

- [Next.js](https://nextjs.org/)
- [Vercel](https://vercel.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [ethers.js](https://docs.ethers.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📮 联系方式

- GitHub: [@your-username](https://github.com/your-username)
- Twitter: [@your-twitter](https://twitter.com/your-twitter)

---

**免责声明**: 本项目仅供学习和研究用途，不构成任何投资建议。加密货币投资有风险，请谨慎决策。
