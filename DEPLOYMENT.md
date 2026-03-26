# 部署指南

本文档介绍如何将 Base Token Monitor 部署到 Vercel。

## 前置要求

- GitHub 账号
- Vercel 账号（可用 GitHub 登录）

## 部署步骤

### 1. 准备代码

```bash
# 克隆你的仓库
git clone https://github.com/your-username/base-token-monitor.git
cd base-token-monitor

# 安装依赖
npm install

# 本地测试
npm run dev
```

### 2. 推送到 GitHub

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 推送到 GitHub（替换为你的仓库地址）
git remote add origin https://github.com/your-username/base-token-monitor.git
git branch -M main
git push -u origin main
```

### 3. 在 Vercel 部署

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign Up" 或 "Log In"，使用 GitHub 账号登录
3. 点击 "Add New..." → "Project"
4. 导入你的 GitHub 仓库
5. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (默认)
   - **Build Command**: `npm run build` (自动检测)
   - **Output Directory**: `.next` (自动检测)

### 4. 配置环境变量

在 Vercel 项目设置中添加环境变量：

1. 点击项目 → Settings → Environment Variables
2. 添加以下变量：
   ```
   Name: BASE_RPC_URL
   Value: https://mainnet.base.org
   ```

### 5. 创建 Vercel KV 数据库

1. 在项目页面，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "KV" (Redis)
4. Vercel 会自动创建数据库并添加所需的环境变量：
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 6. 验证部署

1. 等待部署完成
2. 访问部署的 URL
3. 点击代币进入详情页
4. 点击 "同步数据" 按钮
5. 等待几秒，数据应该会显示出来

### 7. 验证 Cron Jobs

1. 在项目页面，点击 "Settings" → "Cron Jobs"
2. 应该看到一个 Cron Job：
   - Path: `/api/cron`
   - Schedule: `0 * * * *` (每小时)
3. Cron Job 会每小时自动同步所有代币的数据

## 本地开发

如果你想使用 Vercel KV 进行本地开发：

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 登录：
   ```bash
   vercel login
   ```

3. 拉取环境变量：
   ```bash
   vercel env pull .env.local
   ```

4. 运行开发服务器：
   ```bash
   npm run dev
   ```

## 故障排查

### 问题：数据不显示

**解决方案**：
1. 检查是否创建了 KV 数据库
2. 点击 "同步数据" 按钮手动触发同步
3. 查看 Vercel 函数日志，检查是否有错误

### 问题：Cron Job 没有运行

**解决方案**：
1. 检查 `vercel.json` 文件是否存在
2. 在 Vercel 控制台查看 Cron Jobs 日志
3. 确保 `/api/cron` 端点可以正常访问

### 问题：构建失败

**解决方案**：
1. 检查 Node.js 版本（建议 18.x 或 20.x）
2. 删除 `node_modules` 和 `package-lock.json`，重新安装依赖
3. 查看构建日志中的错误信息

## 更新代码

每次你推送新代码到 GitHub，Vercel 会自动部署：

```bash
# 修改代码
git add .
git commit -m "Update something"
git push
```

## 添加新代币

编辑 `lib/tokens.ts` 文件，添加新代币配置：

```typescript
{
  symbol: 'your-token',
  name: 'Your Token',
  address: '0x...',
  decimals: 18,
}
```

提交并推送，Vercel 会自动重新部署。

## 费用说明

本项目使用的 Vercel 服务都是免费的：

- **Hobby 计划**：
  - 无限部署
  - 100GB 带宽/月
  - Serverless 函数执行时间：100小时/月

- **KV 数据库**：
  - 256MB 存储
  - 每天最多 10,000 次读写操作

对于个人使用或小规模监控，这些限制完全足够。

## 下一步

部署完成后，你可以：

1. 自定义主题颜色（编辑 `tailwind.config.ts`）
2. 添加更多代币到监控列表
3. 集成真实的数据源（替换模拟数据）
4. 添加邮件或 Telegram 通知功能

祝你使用愉快！
