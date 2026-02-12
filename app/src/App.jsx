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

function Particle({ emoji, style, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return <span className="particle" style={style}>{emoji}</span>
}

function FloatingText({ x, y, color, rotation, onComplete, text = "好哇！" }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <span
      className="floating-text"
      style={{
        left: x,
        top: y,
        color,
        '--rotation': `${rotation}deg`
      }}
    >
      {text}
    </span>
  )
}

function App() {
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('hoawaCount')
    return saved ? parseInt(saved, 10) : 0
  })
  const [particles, setParticles] = useState([])
  const [isPressed, setIsPressed] = useState(false)
  const [isSuperMode, setIsSuperMode] = useState(false)
  const [superModeProgress, setSuperModeProgress] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [countBounce, setCountBounce] = useState(false)
  const [floatingTexts, setFloatingTexts] = useState([])
  const [showCombo, setShowCombo] = useState(false)
  const [fireworks, setFireworks] = useState([])
  const [comboTexts, setComboTexts] = useState([])
  const [showSuperModeEnd, setShowSuperModeEnd] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [nickname, setNickname] = useState(() => localStorage.getItem('hoawa_nickname') || '')

  const { enabled: notifEnabled, toggleNotification } = useNotification()
  const { scores, loading, myUid, submitScore, fetchScores } = useLeaderboard()
  const scoreSubmitTimer = useRef(null)

  const audioRefs = useRef([])
  const particleIdRef = useRef(0)
  const floatIdRef = useRef(0)
  const fireworkIdRef = useRef(0)
  const buttonRef = useRef(null)
  const clickTimesRef = useRef([])
  const longPressTimer = useRef(null)
  const progressInterval = useRef(null)
  const superModeInterval = useRef(null)

  // 預載音檔
  useEffect(() => {
    audioRefs.current = AUDIO_FILES.map(src => {
      const audio = new Audio(src)
      audio.preload = 'auto'
      return audio
    })
  }, [])

  // 儲存計數到 localStorage
  useEffect(() => {
    localStorage.setItem('hoawaCount', count.toString())
  }, [count])

  // 組件卸載時清理 intervals
  useEffect(() => {
    return () => {
      clearInterval(progressInterval.current)
      clearInterval(superModeInterval.current)
      clearTimeout(longPressTimer.current)
      clearTimeout(scoreSubmitTimer.current)
    }
  }, [])

  const createParticles = useCallback((isSuper = false) => {
    const particleCount = isSuper ? 40 : 20
    const newParticles = []
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 360 + Math.random() * 15
      const distance = isSuper ? 120 + Math.random() * 180 : 80 + Math.random() * 140
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
      newParticles.push({
        id: particleIdRef.current++,
        emoji,
        style: {
          '--angle': `${angle}deg`,
          '--distance': `${distance}px`,
          '--delay': `${Math.random() * 0.2}s`,
          '--scale': isSuper ? 1.5 : 1,
          '--rainbow': isSuper ? `hue-rotate(${Math.random() * 360}deg)` : 'none'
        }
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }, [])

  const removeParticle = useCallback((id) => {
    setParticles(prev => prev.filter(p => p.id !== id))
  }, [])

  const removeFloatingText = useCallback((id) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id))
  }, [])

  const createFloatingText = useCallback((e, isSuper = false, text = "好哇！") => {
    const rect = buttonRef.current.getBoundingClientRect()
    const x = e ? e.clientX - rect.left : rect.width / 2 + (Math.random() - 0.5) * 100
    const y = e ? e.clientY - rect.top : rect.height / 2 + (Math.random() - 0.5) * 100
    const color = isSuper ? '#ffd700' : FLOAT_COLORS[Math.floor(Math.random() * FLOAT_COLORS.length)]
    const rotation = (Math.random() - 0.5) * 30

    const count = isSuper ? 5 : 3
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        setFloatingTexts(prev => [...prev, {
          id: floatIdRef.current++,
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 50,
          color: isSuper ? `hsl(${Math.random() * 360}, 100%, 60%)` : color,
          rotation,
          text: isSuper ? ["超級好哇！🔥", "能量爆發！⚡️", "無敵好哇！💥"][Math.floor(Math.random() * 3)] : text
        }])
      }, i * 100)
    }
  }, [])

  // 煙火特效
  const createFireworks = useCallback((isSuper = false) => {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcfff', '#ff6b9d', '#b784ff', '#4ecdc4', '#ff8a5c']
    const burstCount = isSuper ? 12 : 7
    const newFireworks = []

    for (let burst = 0; burst < burstCount; burst++) {
      const centerX = Math.random() * window.innerWidth
      const centerY = Math.random() * window.innerHeight * 0.7

      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * 360
        const distance = 60 + Math.random() * 100
        const tx = Math.cos(angle * Math.PI / 180) * distance
        const ty = Math.sin(angle * Math.PI / 180) * distance

        newFireworks.push({
          id: fireworkIdRef.current++,
          x: centerX,
          y: centerY,
          color: colors[Math.floor(Math.random() * colors.length)],
          tx,
          ty,
          delay: burst * 0.15,
          size: isSuper ? 8 + Math.random() * 6 : 4 + Math.random() * 4
        })
      }
    }

    setFireworks(newFireworks)
    setTimeout(() => setFireworks([]), 3000)
  }, [])

  // 檢查連擊
  const checkCombo = useCallback(() => {
    const now = Date.now()
    clickTimesRef.current.push(now)
    clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 3000)

    if (clickTimesRef.current.length >= 5) {
      setShowCombo(true)
      createFireworks()

      const texts = ['好哇連發！💥', '超級好哇！🎉', '哇哇哇！✨', '太棒了！💖']
      const colors = ['#fff', '#ffd93d', '#6bcfff', '#ff6b9d']
      const shuffled = texts.sort(() => Math.random() - 0.5).slice(0, 3)
      const newComboTexts = shuffled.map((text, i) => ({
        id: Date.now() + i,
        text,
        x: 10 + Math.random() * 60,
        y: 15 + Math.random() * 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: i * 0.2,
        size: 28 + Math.random() * 24
      }))
      setComboTexts(newComboTexts)
      clickTimesRef.current = []
      setTimeout(() => setShowCombo(false), 3000)
    }
  }, [createFireworks])

  // 🔥 超級好哇模式！
  const startSuperMode = useCallback(() => {
    setIsSuperMode(true)
    setSuperModeProgress(100)

    // 播放特殊音效
    const superAudio = new Audio(`${BASE}hoawa3.mp3`)
    superAudio.playbackRate = 1.5
    superAudio.play().catch(() => { })

    // 自動連發模式
    let superClicks = 0
    superModeInterval.current = setInterval(() => {
      createParticles(true)
      createFloatingText(null, true)

      const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length)
      const audio = audioRefs.current[randomIndex]
      audio.currentTime = 0
      audio.playbackRate = 1.2 + Math.random() * 0.3
      audio.play().catch(() => { })

      setCount(prev => prev + 1)
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
  }, [createFireworks, createFloatingText, createParticles])

  // 長按處理
  const startLongPress = useCallback((e) => {
    e.preventDefault() // 防止 iOS 長按選取圖片
    if (isSuperMode) return

    setIsPressed(true)
    let progress = 0

    progressInterval.current = setInterval(() => {
      progress += 5
      setSuperModeProgress(progress)
      if (progress >= 100) {
        clearInterval(progressInterval.current)
        // 爆炸特效再觸發超級模式
        createParticles(true)
        createFireworks(true)
        startSuperMode()
      }
    }, 125) // 2.5s 充滿
  }, [isSuperMode, startSuperMode, createParticles, createFireworks])

  const endLongPress = useCallback(() => {
    setIsPressed(false)
    clearInterval(progressInterval.current)
    clearTimeout(longPressTimer.current)
    if (!isSuperMode) {
      setSuperModeProgress(0)
    }
  }, [isSuperMode])

  const handleClick = useCallback((e) => {
    if (isSuperMode) return

    createFloatingText(e)
    setTimeout(() => createFloatingText(e), 50)
    createFloatingText(e)

    const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length)
    const audio = audioRefs.current[randomIndex]
    audio.currentTime = 0
    audio.play().catch(() => { })

    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 400)

    createParticles()
    setCount(prev => prev + 1)
    setCountBounce(true)
    setTimeout(() => setCountBounce(false), 300)
    checkCombo()

    // Debounced 排行榜更新
    if (nickname) {
      clearTimeout(scoreSubmitTimer.current)
      scoreSubmitTimer.current = setTimeout(() => {
        const latest = parseInt(localStorage.getItem('hoawaCount') || '0', 10) + 1
        submitScore(nickname, latest)
      }, 2000)
    }
  }, [createParticles, createFloatingText, checkCombo, isSuperMode, nickname, submitScore])

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
    setNickname(name)
    localStorage.setItem('hoawa_nickname', name)
    if (count > 0) submitScore(name, count)
  }, [count, submitScore])

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
          onClose={() => setShowLeaderboard(false)}
          onRefresh={fetchScores}
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
        {!isSuperMode && superModeProgress > 0 && (
          <svg className="charge-ring" viewBox="0 0 100 100">
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
        )}

        {/* 超級模式光環 */}
        {isSuperMode && <div className="super-halo" />}

        {/* 粒子特效 */}
        <div className="particles">
          {particles.map(p => (
            <Particle
              key={p.id}
              emoji={p.emoji}
              style={p.style}
              onComplete={() => removeParticle(p.id)}
            />
          ))}
        </div>

        {/* 浮動文字特效 */}
        {floatingTexts.map(t => (
          <FloatingText
            key={t.id}
            x={t.x}
            y={t.y}
            color={t.color}
            rotation={t.rotation}
            text={t.text}
            onComplete={() => removeFloatingText(t.id)}
          />
        ))}

        {/* 主按鈕 */}
        <button
          className={`main-btn ${isPressed ? 'pressed' : ''} ${isSuperMode ? 'super-btn' : ''}`}
          onClick={handleClick}
          onMouseDown={startLongPress}
          onMouseUp={endLongPress}
          onMouseLeave={endLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={endLongPress}
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

      {/* 連發彩蛋 - 煙火 */}
      {fireworks.map(fw => (
        <div
          key={fw.id}
          className="firework"
          style={{
            left: fw.x,
            top: fw.y,
            backgroundColor: fw.color,
            '--tx': `${fw.tx}px`,
            '--ty': `${fw.ty}px`,
            animationDelay: `${fw.delay}s`,
            width: `${fw.size}px`,
            height: `${fw.size}px`
          }}
        />
      ))}

      {/* 連發彩蛋 - 文字 */}
      {showCombo && (
        <div className="combo-overlay">
          {comboTexts.map(ct => (
            <div
              key={ct.id}
              className="combo-text"
              style={{
                left: `${ct.x}%`,
                top: `${ct.y}%`,
                color: ct.color,
                fontSize: `${ct.size}px`,
                animationDelay: `${ct.delay}s`
              }}
            >
              {ct.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
