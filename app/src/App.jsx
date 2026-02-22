import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { useNotification } from './useNotification'
import { useLeaderboard } from './useLeaderboard'
import NicknameModal from './NicknameModal'
import Leaderboard from './Leaderboard'

const EMOJIS = ['😄', '🎉', '✨', '💫', '🌟', '🥳', '💖', '🌈', '🎀', '🍭', '⭐', '💕', '🎊', '🦋', '🌸']
const BASE = import.meta.env.BASE_URL
const AUDIO_FILES = [`${BASE}hoawa1.mp3`, `${BASE}hoawa2.mp3`, `${BASE}hoawa3.mp3`, `${BASE}hoawa4.mp3`, `${BASE}hoawa5.mp3`]
const FLOAT_COLORS = ['#ff6b9d', '#ff8a5c', '#ffd93d', '#6bcfff', '#b784ff', '#ff6b6b']

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function App() {
  const [count, setCount] = useState(() => {
    const savedDate = localStorage.getItem('hoawaCountDate')
    const today = getToday()
    if (savedDate !== today) {
      localStorage.setItem('hoawaCount', '0')
      localStorage.setItem('hoawaCountDate', today)
      return 0
    }
    const saved = localStorage.getItem('hoawaCount')
    return saved ? parseInt(saved, 10) : 0
  })
  const [totalCount, setTotalCount] = useState(() => {
    const saved = localStorage.getItem('hoawaTotalCount')
    return saved ? parseInt(saved, 10) : 0
  })
  const [isPressed, setIsPressed] = useState(false)
  const [isSuperMode, setIsSuperMode] = useState(false)
  const [superModeProgress, setSuperModeProgress] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [countBounce, setCountBounce] = useState(false)
  const [showSuperModeEnd, setShowSuperModeEnd] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [nickname, setNickname] = useState(() => localStorage.getItem('hoawa_nickname') || '')

  const { enabled: notifEnabled, toggleNotification } = useNotification()
  const { scores, loading, myUid, mode: lbMode, submitScore, fetchScores, switchMode } = useLeaderboard()
  const scoreSubmitTimer = useRef(null)
  // === Audio: Web Audio API ===
  const audioUnlockedRef = useRef(false)
  const audioCtxRef = useRef(null)
  const audioBuffersRef = useRef([])     // decoded AudioBuffer[]
  const rawBuffersRef = useRef([])       // raw ArrayBuffer[]

  const buttonRef = useRef(null)
  const clickTimesRef = useRef([])
  const longPressTimer = useRef(null)
  const superModeInterval = useRef(null)
  const isTouchRef = useRef(false)

  // 1) Mount: fetch raw buffers for Web Audio
  useEffect(() => {
    AUDIO_FILES.forEach((src, i) => {
      fetch(src)
        .then(r => r.arrayBuffer())
        .then(buf => { rawBuffersRef.current[i] = buf })
        .catch(() => { })
    })
  }, [])

  // 2) 第一次 user gesture 時 unlock Audio + 初始化 AudioContext
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return
    audioUnlockedRef.current = true

    // 建立 AudioContext 並 decode
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      if (ctx.state === 'suspended') ctx.resume()

      // 播一個無聲 buffer 解鎖 iOS AudioContext
      const silent = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = silent
      src.connect(ctx.destination)
      src.start(0)

      // decode 所有 raw buffer
      rawBuffersRef.current.forEach((raw, i) => {
        if (raw && !audioBuffersRef.current[i]) {
          ctx.decodeAudioData(raw.slice(0))
            .then(decoded => { audioBuffersRef.current[i] = decoded })
            .catch(() => { })
        }
      })
    } catch (e) {
      console.warn("Web Audio API not supported", e)
    }
  }, [])

  // 3) 播放音效
  const playSound = useCallback((opts = {}) => {
    unlockAudio()
    const fileIndex = opts.index ?? Math.floor(Math.random() * AUDIO_FILES.length)
    const rate = opts.rate ?? (0.8 + Math.random() * 0.5)
    const volume = opts.volume ?? (0.7 + Math.random() * 0.3)

    // 優先用 Web Audio API（零延遲，無 contention）
    const ctx = audioCtxRef.current
    if (ctx && ctx.state === 'running' && audioBuffersRef.current[fileIndex]) {
      const source = ctx.createBufferSource()
      source.buffer = audioBuffersRef.current[fileIndex]
      source.playbackRate.value = rate
      const gain = ctx.createGain()
      gain.gain.value = volume
      source.connect(gain).connect(ctx.destination)
      source.start(0)
    }
  }, [unlockAudio])

  // 儲存計數到 localStorage
  useEffect(() => {
    localStorage.setItem('hoawaCount', count.toString())
    localStorage.setItem('hoawaCountDate', getToday())
  }, [count])

  useEffect(() => {
    localStorage.setItem('hoawaTotalCount', totalCount.toString())
  }, [totalCount])

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      clearInterval(superModeInterval.current)
      clearTimeout(longPressTimer.current)
      clearTimeout(scoreSubmitTimer.current)
    }
  }, [])

  // =========== 原生 DOM 特效（不走 React re-render）===========

  // 粒子特效 - 原生 DOM
  const createParticles = useCallback((isSuper = false) => {
    const container = buttonRef.current?.querySelector('.particles')
    if (!container) return

    const particleCount = isSuper ? 20 : 10
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 360 + Math.random() * 15
      const distance = isSuper ? 120 + Math.random() * 180 : 80 + Math.random() * 140
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]

      const el = document.createElement('span')
      el.className = 'particle'
      el.textContent = emoji
      el.style.cssText = `--angle:${angle}deg;--distance:${distance}px;--delay:${Math.random() * 0.2}s`
      container.appendChild(el)

      // animation 結束後自動移除
      el.addEventListener('animationend', () => el.remove(), { once: true })
    }
  }, [])

  // 浮動文字 - 原生 DOM
  const createFloatingText = useCallback((e, isSuper = false) => {
    const wrapper = buttonRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const baseX = e ? e.clientX - rect.left : rect.width / 2 + (Math.random() - 0.5) * 100
    const baseY = e ? e.clientY - rect.top : rect.height / 2 + (Math.random() - 0.5) * 100

    const textCount = isSuper ? 3 : 2
    const superTexts = ["超級好哇！🔥", "能量爆發！⚡️", "無敵好哇！💥"]

    for (let i = 0; i < textCount; i++) {
      const el = document.createElement('span')
      el.className = 'floating-text'
      const color = isSuper
        ? `hsl(${Math.random() * 360}, 100%, 60%)`
        : FLOAT_COLORS[Math.floor(Math.random() * FLOAT_COLORS.length)]
      const rotation = (Math.random() - 0.5) * 30
      const x = baseX + (Math.random() - 0.5) * 50
      const y = baseY + (Math.random() - 0.5) * 50

      el.textContent = isSuper ? superTexts[Math.floor(Math.random() * 3)] : '好哇！'
      el.style.cssText = `left:${x}px;top:${y}px;color:${color};--rotation:${rotation}deg`
      wrapper.appendChild(el)

      el.addEventListener('animationend', () => el.remove(), { once: true })
    }
  }, [])

  // 煙火特效 - 原生 DOM
  const createFireworks = useCallback((isSuper = false) => {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcfff', '#ff6b9d', '#b784ff', '#4ecdc4', '#ff8a5c']
    const burstCount = isSuper ? 8 : 5
    const particlesPerBurst = 16

    for (let burst = 0; burst < burstCount; burst++) {
      const centerX = Math.random() * window.innerWidth
      const centerY = Math.random() * window.innerHeight * 0.7

      for (let i = 0; i < particlesPerBurst; i++) {
        const angle = (i / particlesPerBurst) * 360
        const distance = 60 + Math.random() * 100
        const tx = Math.cos(angle * Math.PI / 180) * distance
        const ty = Math.sin(angle * Math.PI / 180) * distance
        const size = isSuper ? 8 + Math.random() * 6 : 4 + Math.random() * 4

        const el = document.createElement('div')
        el.className = 'firework'
        el.style.cssText = `left:${centerX}px;top:${centerY}px;background:${colors[Math.floor(Math.random() * colors.length)]};--tx:${tx}px;--ty:${ty}px;animation-delay:${burst * 0.15}s;width:${size}px;height:${size}px`
        document.body.appendChild(el)

        el.addEventListener('animationend', () => el.remove(), { once: true })
      }
    }
  }, [])

  // 連擊文字 - 原生 DOM
  const createComboOverlay = useCallback(() => {
    const overlay = document.createElement('div')
    overlay.className = 'combo-overlay'

    const texts = ['好哇連發！💥', '超級好哇！🎉', '哇哇哇！✨', '太棒了！💖']
    const colors = ['#fff', '#ffd93d', '#6bcfff', '#ff6b9d']
    const shuffled = texts.sort(() => Math.random() - 0.5).slice(0, 3)

    shuffled.forEach((text, i) => {
      const el = document.createElement('div')
      el.className = 'combo-text'
      el.textContent = text
      el.style.cssText = `left:${10 + Math.random() * 60}%;top:${15 + Math.random() * 50}%;color:${colors[Math.floor(Math.random() * colors.length)]};font-size:${28 + Math.random() * 24}px;animation-delay:${i * 0.2}s`
      overlay.appendChild(el)
    })

    document.body.appendChild(overlay)
    setTimeout(() => overlay.remove(), 3000)
  }, [])

  // =========== 遊戲邏輯 ===========

  // 檢查連擊
  const checkCombo = useCallback(() => {
    const now = Date.now()
    clickTimesRef.current.push(now)
    clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 3000)

    if (clickTimesRef.current.length >= 5) {
      createComboOverlay()
      createFireworks()
      clickTimesRef.current = []
    }
  }, [createFireworks, createComboOverlay])

  // 🔥 超級好哇模式！
  const startSuperMode = useCallback(() => {
    setIsSuperMode(true)
    setSuperModeProgress(100)

    // 播放特殊音效
    playSound({ index: 2, rate: 1.5, volume: 1 })

    // 自動連發模式
    let superClicks = 0
    superModeInterval.current = setInterval(() => {
      createParticles(true)
      createFloatingText(null, true)

      playSound({ rate: 1.2 + Math.random() * 0.3 })

      setCount(prev => prev + 1)
      setTotalCount(prev => prev + 1)
      superClicks++

      if (superClicks % 5 === 0) {
        createFireworks(true)
      }
    }, 200)

    // 3 秒後結束
    setTimeout(() => {
      clearInterval(superModeInterval.current)
      setIsSuperMode(false)
      setSuperModeProgress(0)
      setShowSuperModeEnd(true)
      setTimeout(() => setShowSuperModeEnd(false), 2000)
    }, 3000)
  }, [createFireworks, createFloatingText, createParticles, playSound])

  // 長按處理
  const startLongPress = useCallback((e) => {
    // 觸控裝置偵測：忽略合成的 mouse 事件
    if (e.type === 'touchstart') isTouchRef.current = true
    if (e.type === 'mousedown' && isTouchRef.current) return

    if (isSuperMode) return

    unlockAudio() // 確保 iOS audio 在 user gesture 內被啟動
    setIsPressed(true)
    setIsCharging(true)
    // 用 requestAnimationFrame 確保先 render 出初始狀態（offset=full）再觸發 transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSuperModeProgress(100)
      })
    })

    // 2.5 秒後觸發超級模式
    longPressTimer.current = setTimeout(() => {
      createParticles(true)
      createFireworks(true)
      startSuperMode()
    }, 2500)
  }, [isSuperMode, startSuperMode, createParticles, createFireworks, unlockAudio])

  const endLongPress = useCallback((e) => {
    // 觸控裝置上忽略合成的 mouse 事件
    if (e?.type?.startsWith('mouse') && isTouchRef.current) return

    setIsPressed(false)
    setIsCharging(false)
    clearTimeout(longPressTimer.current)
    if (!isSuperMode) {
      setSuperModeProgress(0)
    }
    setTimeout(() => setIsPressed(false), 50)
  }, [isSuperMode])

  const handleClick = useCallback((e) => {
    if (isSuperMode) return

    // 浮動文字：只呼叫 1 次（內部會生成 2 個）
    createFloatingText(e)

    playSound()

    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 400)

    createParticles()
    setCount(prev => prev + 1)
    setTotalCount(prev => prev + 1)
    setCountBounce(true)
    setTimeout(() => setCountBounce(false), 300)
    checkCombo()

    // Debounced 排行榜更新
    if (nickname) {
      clearTimeout(scoreSubmitTimer.current)
      scoreSubmitTimer.current = setTimeout(() => {
        const daily = parseInt(localStorage.getItem('hoawaCount') || '0', 10) + 1
        const total = parseInt(localStorage.getItem('hoawaTotalCount') || '0', 10) + 1
        submitScore(nickname, daily, total)
      }, 2000)
    }
  }, [createParticles, createFloatingText, checkCombo, isSuperMode, nickname, submitScore, playSound])

  const handleShare = useCallback(async () => {
    const text = `今天好哇了 ${count} 次！🎉`
    try {
      await navigator.clipboard.writeText(text)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    }
  }, [count])

  const handleNickname = useCallback((name) => {
    unlockAudio() // user gesture → unlock audio for iOS
    setNickname(name)
    localStorage.setItem('hoawa_nickname', name)
    if (count > 0) submitScore(name, count, totalCount)
  }, [count, totalCount, submitScore, unlockAudio])

  const openLeaderboard = useCallback(() => {
    fetchScores()
    setShowLeaderboard(true)
  }, [fetchScores])

  return (
    <div className={`container ${isSuperMode ? 'super-mode' : ''}`}>
      {/* 暱稱 Modal */}
      {!nickname && <NicknameModal onSubmit={handleNickname} />}

      {/* 排行榜 */}
      {showLeaderboard && (
        <Leaderboard
          scores={scores}
          loading={loading}
          myUid={myUid}
          mode={lbMode}
          onClose={() => setShowLeaderboard(false)}
          onRefresh={() => fetchScores(lbMode)}
          onSwitchMode={switchMode}
        />
      )}

      {/* 頂部按鈕列 */}
      <div className="top-actions">
        <button
          className={`action-btn ${notifEnabled ? 'active' : ''}`}
          onClick={toggleNotification}
          aria-label="通知"
        >
          {notifEnabled ? '🔔' : '🔕'}
        </button>
        <button
          className="action-btn"
          onClick={openLeaderboard}
          aria-label="排行榜"
        >
          🏆
        </button>
        <button className="action-btn" onClick={handleShare} aria-label="分享">
          📤
        </button>
      </div>

      {/* Toast 通知 */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        已複製！✓
      </div>

      {/* 超級模式結束提示 */}
      {showSuperModeEnd && (
        <div className="super-mode-end">
          <div className="super-mode-end-text">⚡️ 能量耗盡 ⚡️</div>
        </div>
      )}

      {/* 主按鈕區域 */}
      <div className={`button-container ${isSuperMode ? 'super-active' : ''}`} ref={buttonRef}>
        {/* 充能進度環 */}
        <svg className={`charge-ring ${isCharging ? 'charging' : ''}`} viewBox="0 0 100 100">
          <circle
            className="charge-ring-bg"
            cx="50"
            cy="50"
            r="45"
          />
          <circle
            className="charge-ring-progress"
            cx="50"
            cy="50"
            r="45"
            style={{
              strokeDasharray: `${2 * Math.PI * 45}`,
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - superModeProgress / 100)}`
            }}
          />
        </svg>

        {/* 超級模式光環 */}
        {isSuperMode && <div className="super-halo" />}

        {/* 粒子容器（原生 DOM 插入點） */}
        <div className="particles" />

        {/* 主按鈕 */}
        <button
          className={`main-btn ${isPressed ? 'pressed' : ''} ${isSuperMode ? 'super-btn' : ''}`}
          onClick={handleClick}
          onMouseDown={startLongPress}
          onMouseUp={endLongPress}
          onMouseLeave={endLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={endLongPress}
          onTouchCancel={endLongPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          <img
            src={`${BASE}baby.webp`}
            alt="好哇！"
            className={`btn-photo ${isSuperMode ? 'super-photo' : ''}`}
            style={{
              transform: !isSuperMode && superModeProgress > 0
                ? `scale(${1 + superModeProgress * 0.003})`
                : undefined
            }}
            draggable={false}
          />
          {isSuperMode && <div className="super-text">⚡️ 超級模式 ⚡️</div>}
        </button>
      </div>

      {/* 計數器 */}
      <div className={`counter ${isSuperMode ? 'super-counter' : ''}`}>
        <span>今天好哇了 </span>
        <span className={`count-number ${countBounce ? 'bounce' : ''} ${isSuperMode ? 'super-count' : ''}`}>{count}</span>
        <span> 次</span>
      </div>
    </div>
  )
}

export default App
