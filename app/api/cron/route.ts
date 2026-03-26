import { NextResponse } from 'next/server'
import { TOKENS } from '@/lib/tokens'

/**
 * Vercel Cron Job 端点
 * POST /api/cron
 * 每小时自动执行，同步所有代币数据
 */
export async function POST(request: Request) {
  try {
    // 验证请求来源（Vercel Cron 会携带特殊的 header）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // 如果设置了 CRON_SECRET，则验证
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // 在开发环境跳过验证
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // 同步所有代币的数据
    const results = []
    const errors = []

    for (const token of TOKENS) {
      try {
        const response = await fetch(
          `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/sync?token=${token.symbol}`,
          {
            method: 'POST',
          }
        )

        if (response.ok) {
          const result = await response.json()
          results.push({
            token: token.symbol,
            success: true,
            message: result.message,
          })
        } else {
          errors.push({
            token: token.symbol,
            error: await response.text(),
          })
        }
      } catch (error) {
        errors.push({
          token: token.symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: TOKENS.length,
        succeeded: results.length,
        failed: errors.length,
      },
      results,
      errors,
    })
  } catch (error) {
    console.error('Cron 执行失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cron 执行失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// 允许 GET 请求用于测试
export async function GET(request: Request) {
  return POST(request)
}
