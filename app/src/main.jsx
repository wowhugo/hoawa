import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const BASE = import.meta.env.BASE_URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// iOS PWA 自動更新：回到前景時檢查 SW 更新
if ('serviceWorker' in navigator) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update()
      })
    }
  })

  // 新 SW 安裝完後自動 reload
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}

// 連網時檢查最新版本
async function checkVersion() {
  if (!navigator.onLine) return
  try {
    const res = await fetch(`${BASE}version.json?t=${Date.now()}`, { cache: 'no-store' })
    const data = await res.json()
    const stored = localStorage.getItem('hoawa_version')
    if (stored && stored !== data.version) {
      console.log(`[Update] ${stored} → ${data.version}`)
      // 強制清除 SW cache 並重載
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          await reg.unregister()
          window.location.reload()
          return
        }
      }
      window.location.reload()
    }
    localStorage.setItem('hoawa_version', data.version)
  } catch {
    // 離線或 fetch 失敗，忽略
  }
}

checkVersion()
