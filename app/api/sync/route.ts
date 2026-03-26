import { NextResponse } from 'next/server'
import { getTokenBySymbol } from '@/lib/tokens'
import {
  saveHolders,
  saveStats,
  saveLastSync,
  addAlert,
  getHolders as getHoldersFromKV,
} from '@/lib/kv'
import { Holder, WhaleAlert, TokenStats } from '@/types'
import { formatBalance, calculatePercentage } from '@/lib/base'

/**
 * 手动触发数据同步
 * POST /api/sync?token=clanker
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenSymbol = searchParams.get('token')

    if (!tokenSymbol) {
      return NextResponse.json(
        { success: false, message: '缺少代币符号参数' },
        { status: 400 }
      )
    }

    const token = getTokenBySymbol(tokenSymbol)
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未找到该代币' },
        { status: 404 }
      )
    }

    // 同步数据
    const result = await syncTokenData(token)

    return NextResponse.json(result)
  } catch (error) {
    console.error('同步失败:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '同步失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * 同步单个代币的数据
 * 注意：这是一个简化的实现
 * 实际生产环境需要使用真实的数据源（如链上数据或第三方 API）
 */
async function syncTokenData(token: any): Promise<{
  success: boolean
  message: string
  token: string
  timestamp: string
}> {
  try {
    // TODO: 实现真实的数据获取逻辑
    // 这里我们使用模拟数据作为示例

    // 1. 获取前 500 持币地址（模拟数据）
    const mockHolders = generateMockHolders(token)

    // 2. 获取之前的持仓数据（用于计算变化）
    const previousHolders = await getHoldersFromKV(token.symbol)

    // 3. 计算持仓变化并生成预警
    const alerts = await calculateChangesAndGenerateAlerts(
      token.symbol,
      mockHolders,
      previousHolders
    )

    // 4. 保存数据到 KV
    await saveHolders(token.symbol, mockHolders)

    // 5. 保存预警
    for (const alert of alerts) {
      await addAlert(token.symbol, alert)
    }

    // 6. 计算并保存统计数据
    const stats = calculateStats(token.symbol, mockHolders)
    await saveStats(token.symbol, stats)

    // 7. 保存最后同步时间
    await saveLastSync(token.symbol, new Date().toISOString())

    return {
      success: true,
      message: '同步成功',
      token: token.symbol,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`同步代币数据失败: ${token.symbol}`, error)
    throw error
  }
}

/**
 * 生成模拟的持币地址数据
 * TODO: 替换为真实的数据获取逻辑
 */
function generateMockHolders(token: any): Holder[] {
  const mockHolders: Holder[] = []
  const totalSupply = BigInt(10 ** 18 * 1_000_000_000) // 10 亿代币

  // 生成前 500 个模拟地址
  for (let i = 1; i <= 500; i++) {
    // 使用指数分布模拟真实情况（大户持有更多）
    const randomFactor = Math.random()
    let balance: bigint

    if (i <= 10) {
      // 前 10 大户
      balance = totalSupply / BigInt(100) + BigInt(Math.floor(Math.random() * 10000000))
    } else if (i <= 100) {
      // 前 100 大户
      balance = totalSupply / BigInt(1000) + BigInt(Math.floor(Math.random() * 1000000))
    } else {
      // 其他
      balance = BigInt(Math.floor(Math.random() * 100000))
    }

    mockHolders.push({
      address: `0x${Math.random().toString(16).slice(2).padStart(40, '0')}`,
      balance: balance.toString(),
      balanceFormatted: formatBalance(balance, token.decimals),
      rank: i,
      percentage: calculatePercentage(balance, totalSupply),
      change24h: Math.random() > 0.5 ? Math.random() * 10 - 5 : undefined,
      lastUpdated: new Date().toISOString(),
    })
  }

  return mockHolders
}

/**
 * 计算持仓变化并生成预警
 */
async function calculateChangesAndGenerateAlerts(
  tokenSymbol: string,
  currentHolders: Holder[],
  previousHolders: Holder[] | null
): Promise<WhaleAlert[]> {
  const alerts: WhaleAlert[] = []

  if (!previousHolders || previousHolders.length === 0) {
    return alerts // 没有历史数据，不生成预警
  }

  // 创建地址到持仓的映射
  const previousMap = new Map(
    previousHolders.map(h => [h.address.toLowerCase(), h])
  )

  // 检查前 100 大户的变化
  for (let i = 0; i < Math.min(100, currentHolders.length); i++) {
    const current = currentHolders[i]
    const previous = previousMap.get(current.address.toLowerCase())

    if (!previous) continue

    const currentBalance = BigInt(current.balance)
    const previousBalance = BigInt(previous.balance)
    const balanceChange = currentBalance - previousBalance
    const percentageChange =
      previousBalance > 0n
        ? Number((balanceChange * BigInt(10000)) / previousBalance) / 100
        : 0

    // 生成预警条件：
    // 1. 前 10 地址变化超过 5%
    // 2. 前 100 地址变化超过 10%
    // 3. 变化金额超过 100 万代币

    const shouldAlert =
      (current.rank <= 10 && Math.abs(percentageChange) > 5) ||
      (current.rank <= 100 && Math.abs(percentageChange) > 10) ||
      (Math.abs(Number(balanceChange)) > 1_000_000 * 10 ** 18)

    if (shouldAlert && balanceChange !== 0n) {
      alerts.push({
        id: `${tokenSymbol}-${current.address}-${Date.now()}`,
        address: current.address,
        action: balanceChange > 0 ? 'buy' : 'sell',
        amount: balanceChange.toString(),
        amountFormatted: formatBalance(balanceChange, 18),
        rank: current.rank,
        percentageChange,
        timestamp: new Date().toISOString(),
        severity:
          Math.abs(percentageChange) > 10 || current.rank <= 10
            ? 'high'
            : Math.abs(percentageChange) > 5
            ? 'medium'
            : 'low',
      })
    }
  }

  return alerts
}

/**
 * 计算统计数据
 */
function calculateStats(tokenSymbol: string, holders: Holder[]): TokenStats {
  const totalHolders = holders.length
  const top10Concentration =
    holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0)
  const top100Concentration =
    holders.slice(0, 100).reduce((sum, h) => sum + h.percentage, 0)

  return {
    symbol: tokenSymbol,
    totalSupply: holders[0]?.balance || '0',
    totalHolders,
    top10Concentration: parseFloat(top10Concentration.toFixed(2)),
    top100Concentration: parseFloat(top100Concentration.toFixed(2)),
    lastUpdated: new Date().toISOString(),
  }
}
