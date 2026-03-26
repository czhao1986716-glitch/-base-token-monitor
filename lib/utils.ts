import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 * 用于动态组合类名，避免冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化数字为易读格式
 * 例如：1234567 -> 1.23M
 */
export function formatNumber(num: number, decimals: number = 2): string {
  if (num === 0) return '0'

  const abs = Math.abs(num)
  if (abs >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B'
  }
  if (abs >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M'
  }
  if (abs >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K'
  }

  return num.toFixed(decimals)
}

/**
 * 格式化地址，只显示前6位和后4位
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * 格式化时间戳为相对时间
 */
export function formatRelativeTime(timestamp: number | string): string {
  const now = Date.now()
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp
  const diff = now - time

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return new Date(time).toLocaleDateString('zh-CN')
}

/**
 * 格式化百分比变化
 */
export function formatPercentChange(change: number): string {
  const formatted = Math.abs(change).toFixed(2)
  if (change > 0) return `+${formatted}%`
  if (change < 0) return `-${formatted}%`
  return '0.00%'
}
