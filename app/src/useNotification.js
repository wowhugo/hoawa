import { useState, useEffect, useCallback } from 'react'

const NOTIFICATION_KEY = 'hoawa_notification_enabled'
const LAST_NOTIFY_KEY = 'hoawa_last_notification'
const NOTIFY_HOUR = 10 // 早上 10 點

export function useNotification() {
    const [enabled, setEnabled] = useState(() => {
        return localStorage.getItem(NOTIFICATION_KEY) === 'true'
    })
    const [permission, setPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    )

    // 檢查是否該發通知
    useEffect(() => {
        if (!enabled || permission !== 'granted') return

        const checkAndNotify = () => {
            const now = new Date()
            const lastNotify = localStorage.getItem(LAST_NOTIFY_KEY)
            const lastVisit = localStorage.getItem('hoawa_last_visit')
            const lastDate = lastNotify ? new Date(lastNotify).toDateString() : null
            const today = now.toDateString()

            // 超過 2 天沒來的提醒
            if (lastVisit) {
                const daysSinceVisit = (now - new Date(lastVisit)) / (1000 * 60 * 60 * 24)
                if (daysSinceVisit >= 2) {
                    new Notification('好久不見！😢', {
                        body: `已經 ${Math.floor(daysSinceVisit)} 天沒好哇了，Mignon想你了 💕`,
                        icon: '/hoawa/icon-512.png',
                        tag: 'hoawa-absence'
                    })
                }
            }

            // 每日提醒
            if (lastDate !== today && now.getHours() >= NOTIFY_HOUR) {
                new Notification('好哇！🎉', {
                    body: '今天還沒好哇喔！來點一下吧 ✨',
                    icon: '/hoawa/icon-512.png',
                    tag: 'hoawa-daily'
                })
                localStorage.setItem(LAST_NOTIFY_KEY, now.toISOString())
            }

            // 更新最後訪問時間
            localStorage.setItem('hoawa_last_visit', now.toISOString())
        }

        checkAndNotify()

        // 每 30 分鐘檢查一次
        const interval = setInterval(checkAndNotify, 30 * 60 * 1000)
        return () => clearInterval(interval)
    }, [enabled, permission])

    const toggleNotification = useCallback(async () => {
        if (!('Notification' in window)) {
            alert('你的瀏覽器不支援通知功能')
            return
        }

        if (!enabled) {
            // 啟用 → 請求權限
            const result = await Notification.requestPermission()
            setPermission(result)

            if (result === 'granted') {
                setEnabled(true)
                localStorage.setItem(NOTIFICATION_KEY, 'true')

                // 馬上發一個確認通知
                new Notification('好哇通知已開啟！🔔', {
                    body: '我會每天提醒你來好哇一下 💖',
                    icon: '/hoawa/icon-512.png'
                })
            }
        } else {
            // 停用
            setEnabled(false)
            localStorage.setItem(NOTIFICATION_KEY, 'false')
        }
    }, [enabled])

    return { enabled, permission, toggleNotification }
}
