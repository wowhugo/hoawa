import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyCD65mp_KM6uP8wAqu4R2sZ6cN_4Me1y8c",
    authDomain: "hoawa-56468.firebaseapp.com",
    projectId: "hoawa-56468",
    storageBucket: "hoawa-56468.firebasestorage.app",
    messagingSenderId: "258752831758",
    appId: "1:258752831758:web:91e05d3791c2a7fa7d375f",
    measurementId: "G-KE8ZPF3J1N"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// 匿名登入
export async function ensureAuth() {
    if (!auth.currentUser) {
        await signInAnonymously(auth)
    }
    return auth.currentUser
}
