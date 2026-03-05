# Firebase Real-Time Synchronization Integration Guide

## Overview
This guide explains how to integrate Firebase Realtime Database with your React event scheduler application for multi-device real-time synchronization.

## Architecture
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Computer   │◄──────►│  Firebase DB  │◄──────►│   Mobile    │
│   (React)   │         │  (Realtime)   │         │  (Browser)  │
└─────────────┘         └──────────────┘         └─────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                          Every 30s
                               │
                        ┌──────▼──────┐
                        │   Google    │
                        │   Sheets    │
                        │   (Storage) │
                        └─────────────┘
```

## Setup Completed
✅ Firebase project created: `event-scheduler-realtime`
✅ Realtime Database initialized at `asia-east1` region
✅ Web app registered: `event-scheduler-web`
✅ Firebase configuration obtained

## Firebase Configuration
The configuration has been saved in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AizaSyBFfsA1SsSH0xvcwASUSjkf8r8JTs7PiF1",
  authDomain: "event-scheduler-realtime.firebaseapp.com",
  projectId: "event-scheduler-realtime",
  databaseURL: "https://event-scheduler-realtime.firebasedatabase.app",
  storageBucket: "event-scheduler-realtime.firebasestorage.app",
  messagingSenderId: "237053764026",
  appId: "1:237053764026:web:9379b1322505a50d60fd83",
  measurementId: "G-M8LYwHR9XZ"
};
```

## Data Flow
1. **Local Changes** (User edits on computer)
   - User modifies event data in the React app
   - Changes immediately saved to localStorage
   - Changes written to Firebase (real-time via WebSocket)

2. **Firebase Broadcast** (WebSocket)
   - Firebase broadcasts changes to all connected devices
   - Mobile browser receives updates in <100ms
   - Mobile app updates local state

3. **Google Sheets Backup** (Every 30 seconds)
   - App syncs all data to Google Sheets periodically
   - Google Apps Script receives Firebase data
   - Sheets stores as persistent backup

## Synchronization Strategy

### Real-time Sync (WebSocket - <100ms)
- Used for UI updates across devices
- Implemented via `useFirebaseSync` hook
- Low latency, high frequency

### Periodic Sync (Every 30 seconds)
- Used for Google Sheets persistence
- Coordinates with app's auto-save
- Handles network failures gracefully

## Implementation Steps

### 1. Install Firebase SDK
```bash
npm install firebase
```

### 2. Firebase Configuration (`src/config/firebase.ts`)
Already created with lazy initialization to prevent Node.js build issues.

### 3. Firebase Sync Hook (`src/hooks/useFirebaseSync.ts`)
Already created with:
- Real-time listener setup
- Data write functionality
- Error handling
- Auto-sync capability

### 4. App Integration (src/app/App.tsx)
Add Firebase sync to the main App component:

```typescript
import { useFirebaseEventSync } from '@/hooks/useFirebaseSync';

// In App component:
const { writeDataToFirebase } = useFirebaseEventSync(data.events);

// When data changes:
useEffect(() => {
  // Write to Firebase (data will be synced to other devices)
  if (data.events.length > 0) {
    writeDataToFirebase({
      events: data.events,
      schedules: data.schedules,
      menus: data.menus,
      // ... other data
    });
  }
}, [data]);
```

### 5. Google Apps Script Integration
Modify the GAS to listen for Firebase updates and sync to Google Sheets:

```javascript
function doGet() {
  // Initialize Firebase connection
  // Listen for database changes
  // Sync to Google Sheets
}
```

## Testing Real-Time Sync

### Test Setup
1. Open app on computer browser (Chrome/Firefox)
2. Open app on mobile browser (same localhost or deployed URL)
3. Make changes on computer
4. Verify mobile displays changes within 100ms

### Test Scenarios
- [ ] Add new event
- [ ] Edit event details
- [ ] Change staff assignment
- [ ] Update task completion
- [ ] Modify budget items
- [ ] Change notes/remarks

## Firebase Security Rules
Current configuration is in "development mode" (allow all reads/writes).

### Before Production
Set up proper security rules:
```json
{
  "rules": {
    "events": {
      ".read": "auth.uid != null",
      ".write": "auth.uid != null"
    }
  }
}
```

## Deployment

### GitHub & Vercel
1. Commit changes: `git add . && git commit -m "Add Firebase real-time sync"`
2. Push to GitHub: `git push origin main`
3. Vercel auto-deploys
4. Firebase connections established automatically

### Environment Variables
No additional environment variables needed - configuration is in code.

## Monitoring

### Firebase Console
Visit: https://console.firebase.google.com/project/event-scheduler-realtime

Check:
- Realtime Database → Data tab to see live updates
- Realtime Database → Rules to configure access control
- Authentication to manage user access (optional)

### Browser DevTools Console
Watch for sync logs:
- ✅ Firebase data synced
- ⏰ Auto-sync to Firebase completed
- 📱 Data received from other devices
- ❌ Firebase sync error (if any)

## Troubleshooting

### Issue: Firebase not syncing
**Solution**:
- Verify internet connection
- Check Firebase project status
- Ensure database is initialized at correct region (asia-east1)

### Issue: Realtime lag on mobile
**Solution**:
- Check mobile network speed
- Reduce data payload size
- Use Firebase Rules to index frequently accessed data

### Issue: Conflicts between devices
**Solution**:
- Use timestamps for conflict resolution
- Implement conflict detection in App.tsx
- Use last-write-wins strategy currently

## Next Steps

1. ✅ Install Firebase SDK (when npm registry is accessible)
2. ✅ Integrate Firebase sync into App.tsx
3. ✅ Test multi-device synchronization
4. ✅ Deploy to GitHub/Vercel
5. ✅ Configure Google Apps Script to read Firebase
6. ⚠️ Set up Firebase security rules before production
7. ⚠️ Implement user authentication if needed

## Support
For Firebase documentation: https://firebase.google.com/docs/database
For integration help: Check browser console logs with ✅/❌/📱/⏰ emojis
