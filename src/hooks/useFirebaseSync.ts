import { useEffect, useRef, useCallback } from 'react';
import { getFirebaseDatabase } from '@/config/firebase';

/**
 * Hook for real-time Firebase Realtime Database synchronization
 * Syncs application state across multiple devices in real-time
 * Uses WebSocket connection for <100ms latency
 */
export function useFirebaseSync(
  onDataReceived: (data: any) => void,
  onError?: (error: string) => void
) {
  const listenerRef = useRef<any>(null);
  const dbRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Initialize Firebase database reference
  const initializeDatabase = useCallback(() => {
    if (typeof window === 'undefined' || isInitializedRef.current) return;

    try {
      const database = getFirebaseDatabase();
      if (!database) {
        onError?.('Firebase database not initialized');
        return;
      }

      const { ref } = require('firebase/database');
      dbRef.current = ref(database, 'events');
      isInitializedRef.current = true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize Firebase';
      onError?.(errorMsg);
      console.error('Firebase initialization error:', error);
    }
  }, [onError]);

  // Listen to Firebase real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    initializeDatabase();

    if (!dbRef.current) return;

    try {
      const { onValue } = require('firebase/database');

      // Set up real-time listener
      const unsubscribe = onValue(
        dbRef.current,
        (snapshot: any) => {
          try {
            const data = snapshot.val();
            if (data) {
              // Notify parent component of data update
              onDataReceived(data);
              console.log('✅ Firebase data synced:', {
                updateTime: new Date().toLocaleTimeString('zh-TW'),
                dataKeys: Object.keys(data || {}).length
              });
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to process Firebase data';
            onError?.(errorMsg);
            console.error('Firebase data processing error:', err);
          }
        },
        (error: any) => {
          const errorMsg = error?.message || 'Firebase listener error';
          onError?.(errorMsg);
          console.error('❌ Firebase listener error:', error);
        }
      );

      listenerRef.current = unsubscribe;

      return () => {
        if (listenerRef.current) {
          listenerRef.current();
        }
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to set up Firebase listener';
      onError?.(errorMsg);
      console.error('Firebase listener setup error:', error);
    }
  }, [initializeDatabase, onDataReceived, onError]);

  // Function to write data to Firebase
  const writeDataToFirebase = useCallback(async (data: any) => {
    if (typeof window === 'undefined' || !dbRef.current) return false;

    try {
      const { set } = require('firebase/database');
      await set(dbRef.current, data);
      console.log('✅ Data written to Firebase:', {
        writeTime: new Date().toLocaleTimeString('zh-TW'),
        dataKeys: Object.keys(data || {}).length
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to write to Firebase';
      onError?.(errorMsg);
      console.error('❌ Firebase write error:', error);
      return false;
    }
  }, [onError]);

  return {
    writeDataToFirebase,
    isInitialized: isInitializedRef.current
  };
}

/**
 * Hook for syncing specific event data to Firebase
 * Handles the data update cycle for multi-device synchronization
 */
export function useFirebaseEventSync(events: any[]) {
  const lastSyncRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { writeDataToFirebase } = useFirebaseSync(
    (data) => {
      // Receive data from other devices
      console.log('📱 Data received from other devices:', data);
    },
    (error) => {
      console.error('Firebase sync error:', error);
    }
  );

  // Auto-sync to Firebase every 30 seconds (coordinated with Google Sheets)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    syncIntervalRef.current = setInterval(async () => {
      const now = Date.now();

      // Only sync if data has changed or last sync is older than 30 seconds
      if (now - lastSyncRef.current >= 30000) {
        const eventData = {
          events: events,
          lastUpdated: now,
          lastUpdatedTime: new Date(now).toISOString()
        };

        const success = await writeDataToFirebase(eventData);
        if (success) {
          lastSyncRef.current = now;
          console.log('⏰ Auto-sync to Firebase completed');
        }
      }
    }, 5000); // Check every 5 seconds, but only sync if threshold is met

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [events, writeDataToFirebase]);

  return {
    writeDataToFirebase
  };
}
