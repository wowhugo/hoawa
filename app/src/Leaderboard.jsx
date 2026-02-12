import { useEffect } from 'react'

function Leaderboard({ scores, loading, myUid, mode, onClose, onRefresh, onSwitchMode }) {
    // ESC 關閉
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onClose])

    const scoreField = mode === 'daily' ? 'dailyScore' : 'totalScore'

    return (
        <>
            <div className="lb-backdrop" onClick={onClose} />
            <div className="lb-panel">
                <div className="lb-header">
                    <h2 className="lb-title">🏆 排行榜</h2>
                    <button className="lb-close" onClick={onClose}>✕</button>
                </div>

                {/* 切換 tabs */}
                <div className="lb-tabs">
                    <button
                        className={`lb-tab ${mode === 'daily' ? 'active' : ''}`}
                        onClick={() => onSwitchMode('daily')}
                    >
                        📅 今日
                    </button>
                    <button
                        className={`lb-tab ${mode === 'total' ? 'active' : ''}`}
                        onClick={() => onSwitchMode('total')}
                    >
                        👑 總榜
                    </button>
                </div>

                <div className="lb-list">
                    {loading ? (
                        <div className="lb-loading">載入中...</div>
                    ) : scores.length === 0 ? (
                        <div className="lb-empty">
                            {mode === 'daily' ? '今天還沒有人好哇，快來當第一名！' : '還沒有人上榜，快來當第一名！'}
                        </div>
                    ) : (
                        scores.map((entry, i) => (
                            <div
                                key={entry.uid}
                                className={`lb-row ${entry.uid === myUid ? 'lb-me' : ''}`}
                            >
                                <span className="lb-rank">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                </span>
                                <span className="lb-name">{entry.nickname}</span>
                                <span className="lb-score">{(entry[scoreField] || 0).toLocaleString()}</span>
                            </div>
                        ))
                    )}
                </div>

                <button className="lb-refresh" onClick={onRefresh}>
                    🔄 重新整理
                </button>
            </div>
        </>
    )
}

export default Leaderboard
