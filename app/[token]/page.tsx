'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { getTokenBySymbol } from '@/lib/tokens'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import { Holder, WhaleAlert, TokenStats } from '@/types'
import { formatNumber, formatAddress, formatRelativeTime, formatPercentChange } from '@/lib/utils'

/**
 * 代币详情页
 */
export default function TokenPage() {
  const params = useParams()
  const tokenSymbol = params.token as string
  const token = getTokenBySymbol(tokenSymbol)

  const [autoRefresh, setAutoRefresh] = useState(true)

  // 获取持币数据
  const { data: holdersData, error: holdersError, mutate: mutateHolders } = useSWR<{
    holders: Holder[]
    total: number
    lastUpdated: string
  }>(`/api/holders/${tokenSymbol}`, {
    refreshInterval: autoRefresh ? 60000 : 0, // 每分钟刷新
    revalidateOnFocus: true,
  })

  // 获取预警数据
  const { data: alertsData, mutate: mutateAlerts } = useSWR<{
    alerts: WhaleAlert[]
    total: number
  }>(`/api/whale-alerts/${tokenSymbol}`, {
    refreshInterval: autoRefresh ? 60000 : 0,
    revalidateOnFocus: true,
  })

  // 手动刷新
  const handleRefresh = async () => {
    await mutateHolders()
    await mutateAlerts()
  }

  // 手动触发同步
  const handleSync = async () => {
    try {
      await fetch(`/api/sync?token=${tokenSymbol}`, { method: 'POST' })
      // 同步后等待 2 秒再刷新数据
      setTimeout(() => {
        mutateHolders()
        mutateAlerts()
      }, 2000)
    } catch (error) {
      console.error('同步失败:', error)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">未找到代币</h1>
          <Link href="/">
            <Button variant="outline">返回主页</Button>
          </Link>
        </div>
      </div>
    )
  }

  const holders = holdersData?.holders || []
  const alerts = alertsData?.alerts || []
  const lastUpdated = holdersData?.lastUpdated

  // 计算统计数据
  const stats = {
    totalHolders: holders.length,
    top10Concentration: holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0),
    top100Concentration: holders.slice(0, 100).reduce((sum, h) => sum + h.percentage, 0),
  }

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{token.name}</h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {token.symbol.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={holdersData === undefined}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
              >
                同步数据
              </Button>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              最后更新: {formatRelativeTime(lastUpdated)}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatCard
            title="持币地址总数"
            value={stats.totalHolders.toLocaleString()}
          />
          <StatCard
            title="前 10 地址占比"
            value={`${stats.top10Concentration.toFixed(2)}%`}
          />
          <StatCard
            title="前 100 地址占比"
            value={`${stats.top100Concentration.toFixed(2)}%`}
          />
          <StatCard
            title="预警数量"
            value={alertsData?.total?.toString() || '0'}
          />
        </div>

        {/* 鲸鱼预警 */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              最近预警
            </h2>
            <div className="grid gap-3">
              {alerts.slice(0, 5).map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-foreground">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-mono">
                            #{alert.rank}
                          </span>
                          <span className="font-mono text-sm">
                            {formatAddress(alert.address)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            alert.action === 'buy' ? 'bg-foreground/10' : 'bg-foreground/5'
                          }`}>
                            {alert.action === 'buy' ? '买入' : '卖出'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                          </span>
                        </div>
                        <p className="text-sm">
                          {alert.action === 'buy' ? '增持' : '减持'}{' '}
                          <span className="font-mono font-semibold">
                            {alert.amountFormatted}
                          </span>
                          {' '}({formatPercentChange(alert.percentageChange)})
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 持币地址表格 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">前 500 持币地址</h2>
            <p className="text-sm text-muted-foreground">
              共 {holders.length} 个地址
            </p>
          </div>

          {holdersError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  加载失败，请稍后重试
                </p>
                <Button onClick={handleSync} variant="outline">
                  触发数据同步
                </Button>
              </CardContent>
            </Card>
          ) : holders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  暂无数据，请先同步数据
                </p>
                <Button onClick={handleSync} variant="outline">
                  立即同步
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card border-b border-border">
                    <tr>
                      <TableHeader>排名</TableHeader>
                      <TableHeader>地址</TableHeader>
                      <TableHeader align="right">持仓数量</TableHeader>
                      <TableHeader align="right">占比</TableHeader>
                      <TableHeader align="right">24h 变化</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.map((holder) => (
                      <tr
                        key={holder.address}
                        className="border-b border-border hover:bg-card-hover transition-colors"
                      >
                        <td className="py-4 px-4 font-mono text-sm">
                          #{holder.rank}
                        </td>
                        <td className="py-4 px-4 font-mono text-sm">
                          <a
                            href={`https://basescan.org/address/${holder.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {formatAddress(holder.address)}
                          </a>
                        </td>
                        <td className="py-4 px-4 text-right font-mono">
                          {holder.balanceFormatted}
                        </td>
                        <td className="py-4 px-4 text-right font-mono">
                          {holder.percentage.toFixed(4)}%
                        </td>
                        <td className="py-4 px-4 text-right font-mono">
                          {holder.change24h !== undefined ? (
                            <span className={
                              holder.change24h > 0 ? 'text-foreground' :
                              holder.change24h < 0 ? 'text-muted-foreground' :
                              ''
                            }>
                              {formatPercentChange(holder.change24h)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

/**
 * 统计卡片组件
 */
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
      </CardContent>
    </Card>
  )
}

/**
 * 表头组件
 */
function TableHeader({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left'
  return (
    <th className={`py-3 px-4 ${alignClass} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>
      {children}
    </th>
  )
}
