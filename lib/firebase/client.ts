// Firebase Configuration for VSCO TR
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAG_sfGmnAveqz1wXB-0bWD1rfg7dTABgs",
    authDomain: "vscotr-27b90.firebaseapp.com",
    projectId: "vscotr-27b90",
    storageBucket: "vscotr-27b90.firebasestorage.app",
    messagingSenderId: "39270460018",
    appId: "1:39270460018:web:d95626c647d3a2463eb0eb",
    measurementId: "G-8QR4BRRBVJ"
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// Collection names (matching our schema)
export const COLLECTIONS = {
    PROFILES: 'profiles',
    POSTS: 'posts',
    LIKES: 'likes',
    FOLLOWS: 'follows',
    REPOSTS: 'reposts',
    PROFILE_LINKS: 'profile_links'
};

export default app;
