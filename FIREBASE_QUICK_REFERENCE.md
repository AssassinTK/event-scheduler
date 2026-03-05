# Firebase Setup - Quick Reference Card

## 📌 Firebase Configuration
```
Project ID: event-scheduler-realtime
App Name: event-scheduler-web
Region: asia-east1
Database URL: https://event-scheduler-realtime.firebasedatabase.app
```

## 🔑 Web SDK Credentials
```
apiKey: AizaSyBFfsA1SsSH0xvcwASUSjkf8r8JTs7PiF1
authDomain: event-scheduler-realtime.firebaseapp.com
projectId: event-scheduler-realtime
databaseURL: https://event-scheduler-realtime.firebasedatabase.app
storageBucket: event-scheduler-realtime.firebasestorage.app
messagingSenderId: 237053764026
appId: 1:237053764026:web:9379b1322505a50d60fd83
measurementId: G-M8LYwHR9XZ
```

## 📂 Files Created
```
✅ src/config/firebase.ts           (Firebase init config)
✅ src/hooks/useFirebaseSync.ts    (Real-time sync hook)
✅ FIREBASE_INTEGRATION.md         (Architecture guide)
✅ FIREBASE_APP_INTEGRATION.md     (Step-by-step integration)
✅ FIREBASE_SETUP_SUMMARY.md       (Complete setup guide)
✅ FIREBASE_QUICK_REFERENCE.md     (This file)
```

## 🔧 Implementation Checklist

### Phase 1: Dependencies (When npm works)
- [ ] Run `npm install firebase`
- [ ] Verify no TypeScript errors
- [ ] Firebase imports resolve correctly

### Phase 2: App Integration (Manual)
Follow steps in `FIREBASE_APP_INTEGRATION.md`:
- [ ] Add Firebase import to App.tsx (line ~4)
- [ ] Add Firebase state variables (line ~360)
- [ ] Initialize Firebase sync hook (line ~380)
- [ ] Add Firebase write in data useEffect (line ~420)
- [ ] (Optional) Add UI status display
- [ ] (Optional) Add error notification

### Phase 3: Testing (Local)
- [ ] `npm run dev` starts without errors
- [ ] App opens in browser
- [ ] Can make local edits
- [ ] No console errors
- [ ] Open second browser window
- [ ] Edit in first window
- [ ] Verify change in second window within 100ms
- [ ] Check console logs for "✅ Firebase data synced"

### Phase 4: Deployment
- [ ] `git add .`
- [ ] `git commit -m "feat: Add Firebase real-time sync"`
- [ ] `git push origin main`
- [ ] Check Vercel deployment succeeded
- [ ] No build errors in Vercel

### Phase 5: Production Testing
- [ ] Open app on computer browser
- [ ] Open app on mobile browser (same URL)
- [ ] Test all sync scenarios
- [ ] Check Firebase console for data
- [ ] Verify offline capability

---

## 🎯 Sync Architecture at a Glance

```
Computer (React) ──┐
                   ├─► Firebase Realtime DB ◄────┐
                   │   (WebSocket <100ms)        │
Mobile (React) ◄───┘                             │
                                                  │
                    Google Sheets ◄─────────────┘
                    (Every 30 seconds)
```

---

## 🚀 Quick Commands

```bash
# Setup
npm install firebase

# Test
npm run dev

# Deploy
git add .
git commit -m "feat: Add Firebase real-time sync"
git push origin main
```

---

## 📊 Real-Time Sync Details

| Aspect | Details |
|--------|---------|
| **Protocol** | WebSocket (Firebase) |
| **Latency** | <100ms between devices |
| **Sync Frequency** | Instant on change |
| **Google Sheets** | Every 30 seconds |
| **Offline Support** | Yes (localStorage queue) |
| **Conflict Resolution** | Last-write-wins |
| **Data Size** | ~50KB typical |

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| npm install fails | npm registry issue, try later |
| TypeScript errors | Check firebase.ts and useFirebaseSync.ts |
| Firebase not syncing | Check browser console, verify database exists |
| Slow sync | Check network, may indicate lag |
| Offline mode | App queues changes, syncs when online |

---

## 🔗 Important Links

- **Firebase Console**: https://console.firebase.google.com/project/event-scheduler-realtime
- **Realtime Database**: https://console.firebase.google.com/project/event-scheduler-realtime/database
- **GitHub Repo**: https://github.com/AssassinTK/event-scheduler
- **Vercel App**: https://event-scheduler-omega-lac.vercel.app
- **Firebase Docs**: https://firebase.google.com/docs/database

---

## ✅ Success Indicators

Look for these signs in browser console:

```
✅ Firebase data synced:
   updateTime: 10:30:45
   dataKeys: 145

📱 Data received from other devices:
   {events: Array, schedules: Array, ...}

⏰ Auto-sync to Firebase completed
```

---

## 💾 Data Sync Status

Current status: **Ready to integrate into App.tsx**

- ✅ Firebase project created
- ✅ Web app registered
- ✅ Configuration obtained
- ✅ Code files generated
- ✅ documentation created
- ⏳ App.tsx integration (manual step)
- ⏳ npm install (when registry available)
- ⏳ Testing & deployment

---

## 📝 Implementation Order

1. **When npm registry is available**: Run `npm install`
2. **Manually update App.tsx** following FIREBASE_APP_INTEGRATION.md
3. **Test locally** with `npm run dev`
4. **Deploy** with `git push origin main`
5. **Test production** with multiple browsers

---

## 🎓 Key Concepts

**Real-time Sync**: Changes broadcast via WebSocket
**Offline Queue**: Local changes stored, synced when online
**Periodic Sync**: Google Sheets backup every 30s
**Lazy Init**: Firebase only initializes in browser (not Node.js)
**Last-Write-Wins**: Latest timestamp takes precedence

---

## 📞 Getting Help

1. Check browser console for error messages
2. Review FIREBASE_SETUP_SUMMARY.md for troubleshooting
3. Check Firebase console (Data & Rules tabs)
4. Verify network connectivity
5. Check GitHub Actions for deployment logs

---

**Status**: 🟢 Ready for App.tsx integration
**Estimated Integration Time**: ~30 minutes
**Estimated Testing Time**: ~20 minutes

