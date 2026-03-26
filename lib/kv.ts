import { kv } from '@vercel/kv'
import { Holder, WhaleAlert, TokenStats, HistorySnapshot } from '@/types'

/**
 * KV 键的前缀
 */
const KEYS = {
  HOLDERS: (token: string) => `token:${token}:holders`,
  HOLDER: (token: string, address: string) => `token:${token}:holder:${address}`,
  HISTORY: (token: string, date: string) => `token:${token}:history:${date}`,
  ALERTS: (token: string) => `token:${token}:alerts`,
  STATS: (token: string) => `token:${token}:stats`,
  LAST_SYNC: (token: string) => `token:${token}:last_sync`,
}

/**
 * 保存持币地址列表
 */
export async function saveHolders(token: string, holders: Holder[]): Promise<void> {
  try {
    await kv.set(KEYS.HOLDERS(token), JSON.stringify(holders))
    // 设置过期时间为 2 小时
    await kv.expire(KEYS.HOLDERS(token), 7200)
  } catch (error) {
    console.error(`保存持币地址失败: ${token}`, error)
    throw error
  }
}

/**
 * 获取持币地址列表
 */
export async function getHolders(token: string): Promise<Holder[] | null> {
  try {
    const data = await kv.get<string>(KEYS.HOLDERS(token))
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error(`获取持币地址失败: ${token}`, error)
    return null
  }
}

/**
 * 保存单个持币地址的详细信息
 */
export async function saveHolder(
  token: string,
  address: string,
  holder: Holder
): Promise<void> {
  try {
    await kv.set(KEYS.HOLDER(token, address), JSON.stringify(holder))
    await kv.expire(KEYS.HOLDER(token, address), 7200)
  } catch (error) {
    console.error(`保存持币地址详情失败: ${address}`, error)
    throw error
  }
}

/**
 * 获取单个持币地址的详细信息
 */
export async function getHolder(
  token: string,
  address: string
): Promise<Holder | null> {
  try {
    const data = await kv.get<string>(KEYS.HOLDER(token, address))
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error(`获取持币地址详情失败: ${address}`, error)
    return null
  }
}

/**
 * 保存鲸鱼预警列表
 */
export async function saveAlerts(token: string, alerts: WhaleAlert[]): Promise<void> {
  try {
    await kv.set(KEYS.ALERTS(token), JSON.stringify(alerts))
    // 预警保留 7 天
    await kv.expire(KEYS.ALERTS(token), 604800)
  } catch (error) {
    console.error(`保存预警失败: ${token}`, error)
    throw error
  }
}

/**
 * 获取鲸鱼预警列表
 */
export async function getAlerts(token: string): Promise<WhaleAlert[] | null> {
  try {
    const data = await kv.get<string>(KEYS.ALERTS(token))
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error(`获取预警失败: ${token}`, error)
    return null
  }
}

/**
 * 添加新的鲸鱼预警
 */
export async function addAlert(token: string, alert: WhaleAlert): Promise<void> {
  try {
    const alerts = await getAlerts(token) || []
    alerts.unshift(alert) // 添加到开头
    // 只保留最近 100 条
    if (alerts.length > 100) {
      alerts.length = 100
    }
    await saveAlerts(token, alerts)
  } catch (error) {
    console.error(`添加预警失败: ${token}`, error)
    throw error
  }
}

/**
 * 保存代币统计数据
 */
export async function saveStats(token: string, stats: TokenStats): Promise<void> {
  try {
    await kv.set(KEYS.STATS(token), JSON.stringify(stats))
    await kv.expire(KEYS.STATS(token), 7200)
  } catch (error) {
    console.error(`保存统计数据失败: ${token}`, error)
    throw error
  }
}

/**
 * 获取代币统计数据
 */
export async function getStats(token: string): Promise<TokenStats | null> {
  try {
    const data = await kv.get<string>(KEYS.STATS(token))
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error(`获取统计数据失败: ${token}`, error)
    return null
  }
}

/**
 * 保存历史快照
 */
export async function saveHistorySnapshot(
  token: string,
  date: string,
  snapshot: HistorySnapshot
): Promise<void> {
  try {
    await kv.set(KEYS.HISTORY(token, date), JSON.stringify(snapshot))
    // 历史数据保留 90 天
    await kv.expire(KEYS.HISTORY(token, date), 7776000)
  } catch (error) {
    console.error(`保存历史快照失败: ${token} - ${date}`, error)
    throw error
  }
}

/**
 * 获取历史快照
 */
export async function getHistorySnapshot(
  token: string,
  date: string
): Promise<HistorySnapshot | null> {
  try {
    const data = await kv.get<string>(KEYS.HISTORY(token, date))
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error(`获取历史快照失败: ${token} - ${date}`, error)
    return null
  }
}

/**
 * 获取所有历史快照
 */
export async function getAllHistorySnapshots(
  token: string
): Promise<HistorySnapshot[]> {
  try {
    const keys = await kv.keys(KEYS.HISTORY(token, '*'))
    const snapshots: HistorySnapshot[] = []

    for (const key of keys) {
      const data = await kv.get<string>(key)
      if (data) {
        snapshots.push(JSON.parse(data))
      }
    }

    // 按日期排序
    snapshots.sort((a, b) => a.date.localeCompare(b.date))
    return snapshots
  } catch (error) {
    console.error(`获取所有历史快照失败: ${token}`, error)
    return []
  }
}

/**
 * 保存最后同步时间
 */
export async function saveLastSync(token: string, timestamp: string): Promise<void> {
  try {
    await kv.set(KEYS.LAST_SYNC(token), timestamp)
  } catch (error) {
    console.error(`保存最后同步时间失败: ${token}`, error)
    throw error
  }
}

/**
 * 获取最后同步时间
 */
export async function getLastSync(token: string): Promise<string | null> {
  try {
    return await kv.get<string>(KEYS.LAST_SYNC(token))
  } catch (error) {
    console.error(`获取最后同步时间失败: ${token}`, error)
    return null
  }
}

/**
 * 删除代币的所有数据
 */
export async function deleteTokenData(token: string): Promise<void> {
  try {
    const keys = await kv.keys(`token:${token}:*`)
    if (keys.length > 0) {
      await kv.del(...keys)
    }
  } catch (error) {
    console.error(`删除代币数据失败: ${token}`, error)
    throw error
  }
}
