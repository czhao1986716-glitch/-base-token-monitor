import { Token } from '@/types'

/**
 * 监控的代币列表
 * 可以添加任意 Base 链上的 ERC20 代币
 */
export const TOKENS: Token[] = [
  {
    symbol: 'clanker',
    name: 'Clanker',
    address: '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb',
    decimals: 18,
    coingeckoId: 'clanker', // 可选，用于价格数据
  },
  // 在这里添加更多代币...
  // {
  //   symbol: 'another-token',
  //   name: 'Another Token',
  //   address: '0x...',
  //   decimals: 18,
  // },
]

/**
 * 根据符号获取代币
 */
export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKENS.find(t => t.symbol.toLowerCase() === symbol.toLowerCase())
}

/**
 * 根据合约地址获取代币
 */
export function getTokenByAddress(address: string): Token | undefined {
  return TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase())
}

/**
 * 获取所有代币符号列表
 */
export function getTokenSymbols(): string[] {
  return TOKENS.map(t => t.symbol)
}

/**
 * 验证代币符号是否有效
 */
export function isValidTokenSymbol(symbol: string): boolean {
  return TOKENS.some(t => t.symbol.toLowerCase() === symbol.toLowerCase())
}
