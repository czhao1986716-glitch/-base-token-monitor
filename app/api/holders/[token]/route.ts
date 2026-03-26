import { NextResponse } from 'next/server'
import { getTokenBySymbol } from '@/lib/tokens'
import { getHolders, getStats } from '@/lib/kv'
import { HoldersResponse } from '@/types'

/**
 * 获取代币的持币地址列表
 * GET /api/holders/[token]?limit=100&offset=0
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

    // 从 KV 获取数据
    const holders = await getHolders(token)
    const stats = await getStats(token)

    if (!holders || holders.length === 0) {
      return NextResponse.json(
        {
          error: '暂无数据，请等待同步完成',
          hint: '首次使用需要等待数据同步，可以访问 /api/sync 手动触发同步',
        },
        { status: 404 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 分页
    const start = offset
    const end = Math.min(offset + limit, holders.length)
    const paginatedHolders = holders.slice(start, end)

    const response: HoldersResponse = {
      token,
      holders: paginatedHolders,
      total: holders.length,
      lastUpdated: stats?.lastUpdated || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取持币地址失败:', error)
    return NextResponse.json(
      { error: '获取数据失败' },
      { status: 500 }
    )
  }
}
