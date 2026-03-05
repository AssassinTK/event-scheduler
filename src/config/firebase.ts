// Firebase Web SDK Configuration
// Generated from Firebase Console
export const firebaseConfig = {
  apiKey: "AizaSyBFfsA1SsSH0xvcwASUSjkf8r8JTs7PiF1",
  authDomain: "event-scheduler-realtime.firebaseapp.com",
  projectId: "event-scheduler-realtime",
  databaseURL: "https://event-scheduler-realtime.firebasedatabase.app",
  storageBucket: "event-scheduler-realtime.firebasestorage.app",
  messagingSenderId: "237053764026",
  appId: "1:237053764026:web:9379b1322505a50d60fd83",
  measurementId: "G-M8LYwHR9XZ"
};

// Initialize Firebase (lazy loaded to avoid issues in non-browser environments)
let firebaseApp: any = null;
let firebaseDatabase: any = null;

export function getFirebaseApp() {
  if (typeof window === 'undefined') return null;

  if (!firebaseApp) {
    try {
      const { initializeApp } = require('firebase/app');
      firebaseApp = initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }
  return firebaseApp;
}

export function getFirebaseDatabase() {
  if (typeof window === 'undefined') return null;

  if (!firebaseDatabase) {
    try {
      const app = getFirebaseApp();
      if (!app) return null;

      const { getDatabase } = require('firebase/database');
      firebaseDatabase = getDatabase(app);
    } catch (error) {
      console.error('Failed to get Firebase database:', error);
    }
  }
  return firebaseDatabase;
}
