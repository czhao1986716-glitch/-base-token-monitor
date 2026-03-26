import { NextResponse } from 'next/server'
import { getTokenBySymbol } from '@/lib/tokens'
import { getAlerts } from '@/lib/kv'
import { AlertsResponse } from '@/types'

/**
 * 获取代币的鲸鱼预警列表
 * GET /api/whale-alerts/[token]?limit=50
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const tokenConfig = getTokenBySymbol(token)

    if (!tokenConfig) {
      return NextResponse.json(
        { error: '未找到该代币' },
        { status: 404 }
      )
    }

    // 从 KV 获取预警数据
    const alerts = await getAlerts(token)

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({
        token,
        alerts: [],
        total: 0,
      })
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // 返回最近的 N 条预警
    const limitedAlerts = alerts.slice(0, limit)

    const response: AlertsResponse = {
      token,
      alerts: limitedAlerts,
      total: alerts.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取预警失败:', error)
    return NextResponse.json(
      { error: '获取数据失败' },
      { status: 500 }
    )
  }
}
