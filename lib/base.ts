import { ethers } from 'ethers'
import { Token, Holder } from '@/types'

// ERC20 ABI (只需要用到的函数)
const ERC20_ABI = [
  // 获取代币总供应量
  'function totalSupply() view returns (uint256)',
  // 获取指定地址的余额
  'function balanceOf(address owner) view returns (uint256)',
  // Transfer 事件
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]

// 已知的交易所热钱包地址 (用于过滤)
const KNOWN_EXCHANGES = [
  '0x4200000000000000000000000000000000000006', // Base 的官方桥接地址
  // 可以添加更多已知的交易所地址
]

// 零地址和特殊地址
const SPECIAL_ADDRESSES = [
  '0x0000000000000000000000000000000000000000', // 零地址
  '0x000000000000000000000000000000000000dead', // 销毁地址
]

/**
 * 获取 Base 链 Provider
 */
export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
  return new ethers.JsonRpcProvider(rpcUrl)
}

/**
 * 获取代币合约实例
 */
export function getTokenContract(token: Token) {
  const provider = getProvider()
  return new ethers.Contract(token.address, ERC20_ABI, provider)
}

/**
 * 获取代币总供应量
 */
export async function getTokenTotalSupply(token: Token): Promise<bigint> {
  const contract = getTokenContract(token)
  try {
    const totalSupply = await contract.totalSupply()
    return totalSupply as bigint
  } catch (error) {
    console.error(`获取代币总供应量失败: ${token.symbol}`, error)
    throw error
  }
}

/**
 * 获取指定地址的余额
 */
export async function getBalance(token: Token, address: string): Promise<bigint> {
  const contract = getTokenContract(token)
  try {
    const balance = await contract.balanceOf(address)
    return balance as bigint
  } catch (error) {
    console.error(`获取余额失败: ${address}`, error)
    return 0n
  }
}

/**
 * 获取前N个持币地址
 * 注意：ERC20 代币不提供直接获取所有持币地址的方法
 * 这个方法使用 Transfer 事件来追踪持币地址
 *
 * 这是一个简化版本，实际生产环境可能需要：
 * 1. 使用索引服务 (如 The Graph)
 * 2. 或使用第三方 API (如 DeBank, DeBankScore)
 * 3. 或自行运行索引节点
 */
export async function getTopHolders(
  token: Token,
  limit: number = 500
): Promise<Holder[]> {
  try {
    const provider = getProvider()
    const contract = getTokenContract(token)

    // 获取总供应量
    const totalSupply = await getTokenTotalSupply(token)

    // 获取 Transfer 事件
    // 注意：这只是一个简化的实现，实际上需要：
    // 1. 从创世区块开始扫描所有 Transfer 事件
    // 2. 计算每个地址的最终余额
    // 3. 排序并返回前N个

    // 由于 Base 链的区块数据量很大，这里使用一个简化的方法
    // 实际生产环境建议使用索引服务

    // 这里我们使用一个示例实现
    // 在实际部署时，需要替换为真实的数据源

    // 示例：返回一些模拟数据
    // TODO: 实现真实的数据获取逻辑
    const mockHolders: Holder[] = []

    return mockHolders
  } catch (error) {
    console.error(`获取持币地址失败: ${token.symbol}`, error)
    throw error
  }
}

/**
 * 从 Transfer 事件构建持币地址列表
 * 这是一个更完整的实现，但需要较长时间
 */
export async function buildHoldersFromEvents(
  token: Token,
  fromBlock: number = 0,
  toBlock?: number
): Promise<Map<string, bigint>> {
  const provider = getProvider()
  const contract = getTokenContract(token)
  const holders = new Map<string, bigint>()

  try {
    const latestBlock = toBlock || await provider.getBlockNumber()
    const batchSize = 10000 // 每次查询的区块范围

    // 分批获取 Transfer 事件
    for (let block = fromBlock; block <= latestBlock; block += batchSize) {
      const endBlock = Math.min(block + batchSize - 1, latestBlock)

      const events = await contract.queryFilter(
        contract.filters.Transfer(),
        block,
        endBlock
      )

      // 处理每个事件
      for (const event of events) {
        // 类型守卫：检查是否是 EventLog
        if (!('args' in event) || !event.args) continue

        const from = event.args[0] as string
        const to = event.args[1] as string
        const value = event.args[2] as bigint

        // 跳过特殊地址
        if (SPECIAL_ADDRESSES.includes(from.toLowerCase()) ||
            SPECIAL_ADDRESSES.includes(to.toLowerCase())) {
          continue
        }

        // 更新 from 地址余额
        if (from !== ethers.ZeroAddress) {
          const fromBalance = holders.get(from) || 0n
          holders.set(from, fromBalance - value)
        }

        // 更新 to 地址余额
        const toBalance = holders.get(to) || 0n
        holders.set(to, toBalance + value)
      }
    }

    // 过滤掉余额为 0 的地址
    const filteredHolders = new Map<string, bigint>()
    for (const [address, balance] of holders.entries()) {
      if (balance > 0n) {
        filteredHolders.set(address, balance)
      }
    }

    return filteredHolders
  } catch (error) {
    console.error('构建持币地址列表失败', error)
    throw error
  }
}

/**
 * 过滤已知的交易所和特殊地址
 */
export function filterKnownAddresses(addresses: string[]): string[] {
  return addresses.filter(address => {
    const lower = address.toLowerCase()
    return !KNOWN_EXCHANGES.includes(lower) &&
           !SPECIAL_ADDRESSES.includes(lower)
  })
}

/**
 * 格式化余额为易读格式
 */
export function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const whole = balance / divisor
  const fraction = balance % divisor

  if (fraction === 0n) {
    return whole.toString()
  }

  const fractionStr = fraction.toString().padStart(decimals, '0')
  // 移除尾部的零
  const trimmedFraction = fractionStr.replace(/0+$/, '')

  return `${whole}.${trimmedFraction}`
}

/**
 * 计算持币百分比
 */
export function calculatePercentage(
  balance: bigint,
  totalSupply: bigint
): number {
  if (totalSupply === 0n) return 0

  const percentage = (Number(balance) / Number(totalSupply)) * 100
  return parseFloat(percentage.toFixed(4))
}
