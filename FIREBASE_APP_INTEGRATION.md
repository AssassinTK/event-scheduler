# Firebase Integration into App.tsx - Step-by-Step Guide

## Overview
This document provides the exact code changes needed to integrate Firebase real-time synchronization into your React application.

## Step 1: Add Firebase Import
**Location**: Line 4-8 in `src/app/App.tsx`

**Current Code**:
```typescript
import { EditableText } from './components/EditableText';
import { EditableCheckbox } from './components/EditableCheckbox';
import { EditableSelect } from './components/EditableSelect';
import '../styles/section-title.css';
import '../styles/table.css';
```

**New Code** (Add after existing imports):
```typescript
import { EditableText } from './components/EditableText';
import { EditableCheckbox } from './components/EditableCheckbox';
import { EditableSelect } from './components/EditableSelect';
import { useFirebaseEventSync } from '@/hooks/useFirebaseSync';
import '../styles/section-title.css';
import '../styles/table.css';
```

---

## Step 2: Add Firebase State Variables
**Location**: Around line 360-375 in `src/app/App.tsx`

**Add these state variables**:
```typescript
  // Firebase real-time sync state
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string>('');
  const [lastFirebaseSync, setLastFirebaseSync] = useState<number>(0);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
```

---

## Step 3: Initialize Firebase Sync Hook
**Location**: After the state variables (around line 380)

**Add this code**:
```typescript
  // Initialize Firebase real-time sync
  const { writeDataToFirebase } = useFirebaseEventSync(data.events);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setFirebaseConnected(true);
  }, []);
```

---

## Step 4: Add Firebase Write on Data Change
**Location**: Find the existing `useEffect` that saves to localStorage (around line 420-450)

**Current Code** (approximately):
```typescript
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem('beach101-schedule', JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [data]);
```

**Updated Code**:
```typescript
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Save to localStorage (local storage)
    localStorage.setItem('beach101-schedule', JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Write to Firebase (real-time sync)
    const writeToFirebase = async () => {
      try {
        setIsFirebaseSyncing(true);
        const success = await writeDataToFirebase({
          events: data.events,
          schedules: data.schedules,
          menus: data.menus,
          notes: data.notes,
          preparationItems: data.preparationItems,
          staffMembers: data.staffMembers,
          tasks: data.tasks,
          tablePlacementItems: data.tablePlacementItems,
          personalSchedules: data.personalSchedules,
          budgets: data.budgets,
          remarks: data.remarks,
          globalStaff: data.globalStaff,
          globalTasks: data.globalTasks,
          lastUpdated: Date.now(),
          lastUpdatedTime: new Date().toISOString()
        });

        if (success) {
          setLastFirebaseSync(Date.now());
          setFirebaseError('');
          console.log('✅ Data synced to Firebase');
        }
        setIsFirebaseSyncing(false);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Firebase sync failed';
        setFirebaseError(errorMsg);
        setIsFirebaseSyncing(false);
        console.error('❌ Firebase sync error:', error);
      }
    };

    writeToFirebase();
  }, [data, writeDataToFirebase]);
```

---

## Step 5: Add Firebase Status Display (Optional)
**Location**: In the top bar where other status indicators are displayed (around line 800-850)

**Add this in the UI**:
```tsx
          {/* Firebase Sync Status */}
          <div className="flex items-center gap-2 text-xs">
            {firebaseConnected ? (
              <div className="flex items-center gap-1 text-blue-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span>Firebase实时同步</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span>Firebase 离线</span>
              </div>
            )}
            {isFirebaseSyncing && <span className="animate-spin">↻</span>}
            {lastFirebaseSync > 0 && (
              <span className="text-gray-500">
                ({new Date(lastFirebaseSync).toLocaleTimeString('zh-TW')})
              </span>
            )}
          </div>
```

---

## Step 6: Error Handling Display
**Location**: In the main content area, add error notification

**Add this in the render**:
```tsx
        {/* Firebase Error Alert */}
        {firebaseError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              <strong>Firebase 同步错误:</strong> {firebaseError}
            </p>
          </div>
        )}
```

---

## Step 7: Verify Dependencies
Ensure your `package.json` has:
```json
"firebase": "^11.0.0"
```

This has been added automatically.

---

## Implementation Checklist

- [ ] Step 1: Add Firebase import
- [ ] Step 2: Add Firebase state variables
- [ ] Step 3: Initialize Firebase sync hook
- [ ] Step 4: Add Firebase write on data change
- [ ] Step 5: (Optional) Add Firebase status display in UI
- [ ] Step 6: (Optional) Add error handling display
- [ ] Step 7: Verify package.json has Firebase dependency
- [ ] Run `npm install` when npm registry is available
- [ ] Test locally with `npm run dev`
- [ ] Commit changes and push to GitHub
- [ ] Verify Vercel deployment succeeds
- [ ] Test multi-device sync in browsers

---

## Testing the Integration

### Local Testing
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in two browser windows
# Make changes in one window and verify they appear in the other within 100ms
```

### Deployment Testing
1. Commit and push to GitHub
2. Vercel auto-deploys
3. Open app on computer and mobile
4. Make changes on computer
5. Verify mobile shows changes within 100ms

---

## Important Notes

1. **Firebase Lazy Initialization**: The Firebase config file uses lazy initialization to avoid Node.js errors during Vercel build.

2. **Network Conditions**: Real-time sync requires internet connection. Gracefully handles offline scenarios.

3. **Data Size**: Current implementation syncs the entire schedule data. For very large datasets, consider:
   - Syncing only changed fields
   - Implementing incremental updates
   - Compressing data

4. **Timestamps**: Each sync includes `lastUpdated` for conflict resolution.

---

## Common Issues & Solutions

### Issue: "Firebase is not defined"
**Solution**: Ensure npm install completes successfully and Firebase is in node_modules

### Issue: Sync not working on mobile
**Solution**: Check browser console for network errors, verify Firebase database is initialized

### Issue: Data not syncing between devices
**Solution**:
- Verify both devices are connected to internet
- Check Firebase console to see if data is being written
- Verify both browsers are on same app (localhost or same deployed URL)

---

## Next Steps After Integration

1. Test local real-time sync
2. Deploy to Vercel
3. Test on mobile devices
4. Configure Google Apps Script to read Firebase data
5. Set up Firebase security rules
6. Consider adding user authentication

---

## Reference Files

- Configuration: `src/config/firebase.ts`
- Hook: `src/hooks/useFirebaseSync.ts`
- Main App: `src/app/App.tsx` (after integration)
