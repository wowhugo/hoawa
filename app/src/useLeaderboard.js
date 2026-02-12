import { useState, useCallback } from 'react'
import { db, ensureAuth } from './firebase'
import {
    doc,
    setDoc,
    getDocs,
    collection,
    query,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore'

export function useLeaderboard() {
    const [scores, setScores] = useState([])
    const [loading, setLoading] = useState(false)
    const [myUid, setMyUid] = useState(null)

    const submitScore = useCallback(async (nickname, score) => {
        try {
            const user = await ensureAuth()
            if (!user) return

            setMyUid(user.uid)

            await setDoc(doc(db, 'leaderboard', user.uid), {
                nickname,
                score,
                updatedAt: serverTimestamp()
            }, { merge: true })
        } catch (err) {
            console.error('Failed to submit score:', err)
        }
    }, [])

    const fetchScores = useCallback(async () => {
        setLoading(true)
        try {
            const user = await ensureAuth()
            if (user) setMyUid(user.uid)

            const q = query(
                collection(db, 'leaderboard'),
                orderBy('score', 'desc'),
                limit(10)
            )
            const snapshot = await getDocs(q)
            const data = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }))
            setScores(data)
        } catch (err) {
            console.error('Failed to fetch scores:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    return { scores, loading, myUid, submitScore, fetchScores }
}
