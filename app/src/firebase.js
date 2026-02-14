// Lazy-loaded Firebase — 只在需要時才初始化
let _app, _db, _auth

async function getApp() {
    if (!_app) {
        const { initializeApp } = await import('firebase/app')
        _app = initializeApp({
            apiKey: "AIzaSyCD65mp_KM6uP8wAqu4R2sZ6cN_4Me1y8c",
            authDomain: "hoawa-56468.firebaseapp.com",
            projectId: "hoawa-56468",
            storageBucket: "hoawa-56468.firebasestorage.app",
            messagingSenderId: "258752831758",
            appId: "1:258752831758:web:91e05d3791c2a7fa7d375f",
            measurementId: "G-KE8ZPF3J1N"
        })
    }
    return _app
}

export async function getDb() {
    if (!_db) {
        const app = await getApp()
        const { getFirestore } = await import('firebase/firestore')
        _db = getFirestore(app)
    }
    return _db
}

export async function ensureAuth() {
    if (!_auth) {
        const app = await getApp()
        const { getAuth } = await import('firebase/auth')
        _auth = getAuth(app)
    }
    if (!_auth.currentUser) {
        const { signInAnonymously } = await import('firebase/auth')
        await signInAnonymously(_auth)
    }
    return _auth.currentUser
}
