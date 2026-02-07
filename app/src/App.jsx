import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const EMOJIS = ['😄', '🎉', '✨', '💫', '🌟']
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
  const audioRefs = useRef([])
  const particleIdRef = useRef(0)
  const floatIdRef = useRef(0)
  const buttonRef = useRef(null)

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
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * 360
      const distance = 100 + Math.random() * 100
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

  const handleClick = useCallback((e) => {
    // 浮動文字特效
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
  }, [createParticles, createFloatingText])

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
    </div>
  )
}

export default App
