// Firebase config — build 時由 Vite 替換為實際值
const FIREBASE_CONFIG = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Lazy-loaded Firebase — 只在需要時才初始化
let _app, _db, _auth

async function getApp() {
    if (!_app) {
        const { initializeApp } = await import('firebase/app')
        _app = initializeApp(FIREBASE_CONFIG)
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
