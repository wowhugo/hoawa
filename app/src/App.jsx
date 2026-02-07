import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

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

function FloatingText({ x, y, color, rotation, onComplete }) {
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
      好哇！
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
  const [showToast, setShowToast] = useState(false)
  const [countBounce, setCountBounce] = useState(false)
  const [floatingTexts, setFloatingTexts] = useState([])
  const [showCombo, setShowCombo] = useState(false)
  const [fireworks, setFireworks] = useState([])
  const [comboTexts, setComboTexts] = useState([])
  const audioRefs = useRef([])
  const particleIdRef = useRef(0)
  const floatIdRef = useRef(0)
  const fireworkIdRef = useRef(0)
  const buttonRef = useRef(null)
  const clickTimesRef = useRef([])

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

  const createParticles = useCallback(() => {
    const newParticles = []
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * 360 + Math.random() * 15
      const distance = 80 + Math.random() * 140
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
      newParticles.push({
        id: particleIdRef.current++,
        emoji,
        style: {
          '--angle': `${angle}deg`,
          '--distance': `${distance}px`,
          '--delay': `${Math.random() * 0.2}s`
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

  const createFloatingText = useCallback((e) => {
    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const color = FLOAT_COLORS[Math.floor(Math.random() * FLOAT_COLORS.length)]
    const rotation = (Math.random() - 0.5) * 30 // -15 to 15 degrees

    setFloatingTexts(prev => [...prev, {
      id: floatIdRef.current++,
      x,
      y,
      color,
      rotation
    }])
  }, [])

  // 連擊彩蛋 - 煙火生成
  const createFireworks = useCallback(() => {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcfff', '#ff6b9d', '#b784ff', '#4ecdc4', '#ff8a5c']
    const newFireworks = []

    // 更多煙火！更可愛！
    for (let burst = 0; burst < 7; burst++) {
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
          delay: burst * 0.2
        })
      }
    }

    setFireworks(newFireworks)
    setTimeout(() => setFireworks([]), 2000)
  }, [])

  // 檢查連擊
  const checkCombo = useCallback(() => {
    const now = Date.now()
    clickTimesRef.current.push(now)

    // 只保留 3 秒內的點擊
    clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 3000)

    if (clickTimesRef.current.length >= 5) {
      // 觸發連發彩蛋！
      setShowCombo(true)
      createFireworks()

      // 隨機生成連擊文字
      const texts = ['好哇連發！💥', '超級好哇！🎉', '哇哇哇！✨', '太棒了！💖', '好哇好哇！🌈']
      const colors = ['#fff', '#ffd93d', '#6bcfff', '#ff6b9d', '#b784ff']
      const shuffled = texts.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2))
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

      clickTimesRef.current = [] // 重置

      setTimeout(() => setShowCombo(false), 3000)
    }
  }, [createFireworks])

  const handleClick = useCallback((e) => {
    // 多一點浮動文字！
    createFloatingText(e)
    setTimeout(() => createFloatingText(e), 50)
    createFloatingText(e)

    // 播放隨機音效
    const randomIndex = Math.floor(Math.random() * AUDIO_FILES.length)
    const audio = audioRefs.current[randomIndex]
    audio.currentTime = 0
    audio.play().catch(() => { })

    // 按鈕動畫
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 400)


    // 粒子特效
    createParticles()

    // 更新計數
    setCount(prev => prev + 1)
    setCountBounce(true)
    setTimeout(() => setCountBounce(false), 300)

    // 檢查連擊彩蛋
    checkCombo()
  }, [createParticles, createFloatingText, checkCombo])

  const handleShare = useCallback(async () => {
    const text = `今天好哇了 ${count} 次！🎉`
    try {
      await navigator.clipboard.writeText(text)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch {
      // 備用方案
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

  return (
    <div className="container">
      {/* 分享按鈕 */}
      <button className="share-btn" onClick={handleShare} aria-label="分享">
        📤
      </button>

      {/* Toast 通知 */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        已複製！✓
      </div>

      {/* 主按鈕區域 */}
      <div className="button-container" ref={buttonRef}>
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
            onComplete={() => removeFloatingText(t.id)}
          />
        ))}

        {/* 主按鈕 - 照片 */}
        <button
          className={`main-btn ${isPressed ? 'pressed' : ''}`}
          onClick={handleClick}
        >
          <img src={`${BASE}baby.webp`} alt="好哇！" className="btn-photo" />
        </button>
      </div>

      {/* 計數器 */}
      <div className="counter">
        <span>今天好哇了 </span>
        <span className={`count-number ${countBounce ? 'bounce' : ''}`}>{count}</span>
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
            animationDelay: `${fw.delay}s`
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
                animationDelay: `${ct.delay}s`,
                position: 'absolute'
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
