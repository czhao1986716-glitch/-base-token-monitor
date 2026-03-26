/**
 * 代币配置类型
 */
export interface Token {
  symbol: string          // 代币符号 (例如: "clanker")
  name: string            // 代币名称 (例如: "Clanker")
  address: string         // 合约地址
  decimals: number        // 小数位数
  coingeckoId?: string    // CoinGecko ID (可选，用于价格数据)
}

/**
 * 持币地址信息
 */
export interface Holder {
  address: string         // 钱包地址
  balance: string         // 持币数量 (原始值，未格式化)
  balanceFormatted: string // 格式化后的持币数量
  rank: number            // 排名
  percentage: number      // 持币百分比
  change24h?: number      // 24小时变化百分比 (可选)
  lastUpdated?: string    // 最后更新时间
}

/**
 * 鲸鱼预警信息
 */
export interface WhaleAlert {
  id: string              // 预警 ID
  address: string         // 钱包地址
  action: 'buy' | 'sell'  // 买入或卖出
  amount: string          // 数量 (原始值)
  amountFormatted: string // 格式化后的数量
  rank: number            // 排名
  percentageChange: number // 百分比变化
  timestamp: string       // 时间戳
  severity: 'low' | 'medium' | 'high' // 严重程度
}

/**
 * 代币统计数据
 */
export interface TokenStats {
  symbol: string
  totalSupply: string     // 总供应量
  totalHolders: number    // 持币地址总数
  top10Concentration: number // 前10地址持仓百分比
  top100Concentration: number // 前100地址持仓百分比
  lastUpdated: string     // 最后更新时间
}

/**
 * 历史快照数据
 */
export interface HistorySnapshot {
  date: string            // 日期 (YYYY-MM-DD)
  top10Concentration: number
  top100Concentration: number
  totalHolders: number
}

/**
 * API 响应类型
 */
export interface HoldersResponse {
  token: string
  holders: Holder[]
  total: number
  lastUpdated: string
}

export interface AlertsResponse {
  token: string
  alerts: WhaleAlert[]
  total: number
}

export interface SyncResponse {
  success: boolean
  message: string
  tokensUpdated: string[]
  timestamp: string
}
