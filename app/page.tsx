import Link from 'next/link'
import { TOKENS } from '@/lib/tokens'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

/**
 * 主页 - 显示所有监控的代币列表
 */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 头部 */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Base Token Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Base 链代币持仓监控系统 - 监控前 500 持币地址变化
          </p>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">监控的代币</h2>
          <p className="text-muted-foreground">
            当前正在监控 {TOKENS.length} 个代币的持仓变化
          </p>
        </div>

        {/* 代币卡片列表 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TOKENS.map((token) => (
            <Card key={token.symbol} className="hover:bg-card-hover transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{token.name}</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {token.symbol.toUpperCase()}
                  </span>
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  {token.address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/${token.symbol}`}>
                  <Button className="w-full" variant="outline">
                    查看详情
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 添加新代币提示 */}
        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle>添加更多代币</CardTitle>
            <CardDescription>
              要监控更多代币，请在 <code className="bg-card px-2 py-1 rounded">lib/tokens.ts</code> 中添加配置
            </CardDescription>
          </CardHeader>
        </Card>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>数据每小时自动同步 | 部署在 Vercel | 开源项目</p>
        </div>
      </footer>
    </div>
  )
}
