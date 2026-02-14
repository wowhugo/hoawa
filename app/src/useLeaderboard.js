import { useState, useCallback } from 'react'
import { getDb, ensureAuth } from './firebase'

function getToday() {
    return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function useLeaderboard() {
    const [scores, setScores] = useState([])
    const [loading, setLoading] = useState(false)
    const [myUid, setMyUid] = useState(null)
    const [mode, setMode] = useState('daily') // 'daily' | 'total'

    const submitScore = useCallback(async (nickname, dailyScore, totalScore) => {
        try {
            const user = await ensureAuth()
            if (!user) return

            setMyUid(user.uid)

            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
            const db = await getDb()
            await setDoc(doc(db, 'leaderboard', user.uid), {
                nickname,
                dailyScore,
                dailyDate: getToday(),
                totalScore,
                updatedAt: serverTimestamp()
            }, { merge: true })
        } catch (err) {
            console.error('Failed to submit score:', err)
        }
    }, [])

    const fetchScores = useCallback(async (fetchMode) => {
        const currentMode = fetchMode || mode
        setLoading(true)
        try {
            const user = await ensureAuth()
            if (user) setMyUid(user.uid)

            const { getDocs, collection, query, orderBy, limit } = await import('firebase/firestore')
            const db = await getDb()
            const sortField = currentMode === 'daily' ? 'dailyScore' : 'totalScore'
            const q = query(
                collection(db, 'leaderboard'),
                orderBy(sortField, 'desc'),
                limit(10)
            )
            const snapshot = await getDocs(q)
            const today = getToday()
            const data = snapshot.docs.map(d => ({
                uid: d.id,
                ...d.data()
            })).filter(entry => {
                // 每日模式只顯示今天的
                if (currentMode === 'daily') {
                    return entry.dailyDate === today
                }
                return true
            })
            setScores(data)
        } catch (err) {
            console.error('Failed to fetch scores:', err)
        } finally {
            setLoading(false)
        }
    }, [mode])

    const switchMode = useCallback((newMode) => {
        setMode(newMode)
        fetchScores(newMode)
    }, [fetchScores])

    return { scores, loading, myUid, mode, submitScore, fetchScores, switchMode }
}
