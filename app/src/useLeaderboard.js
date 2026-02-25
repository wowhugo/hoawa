import { useState, useCallback } from 'react'
import { getDb, ensureAuth } from './firebase'

function getToday() {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${date}`
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

            const { getDocs, collection, query, orderBy, limit, where } = await import('firebase/firestore')
            const db = await getDb()
            const today = getToday()

            let q
            if (currentMode === 'daily') {
                // 找出今天的資料，再照分數反向排序
                q = query(
                    collection(db, 'leaderboard'),
                    where('dailyDate', '==', today),
                    orderBy('dailyScore', 'desc'),
                    limit(10)
                )
            } else {
                q = query(
                    collection(db, 'leaderboard'),
                    orderBy('totalScore', 'desc'),
                    limit(10)
                )
            }

            const snapshot = await getDocs(q)
            const data = snapshot.docs.map(d => ({
                uid: d.id,
                ...d.data()
            }))

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
