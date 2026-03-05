import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Save, Trash2, Printer, Moon, Sun, Check, Plus, X, Download, RefreshCw, Calendar, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { EditableText } from './components/EditableText';
import { EditableCheckbox } from './components/EditableCheckbox';
import { EditableSelect } from './components/EditableSelect';
import '../styles/section-title.css';
import '../styles/table.css';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyyQpsYz0bRJEEZydXTlcIo22Xap-BsftpDw6g_DLvv8tEMP-UW7WJf6RDQFdRmtDyxAg/exec';

// ========== 新架構資料結構 ==========

interface Event {
  eventId: string;
  name: string;
  date: string;
  timeSlot: string;
  scale: string;
  status: string;
  icon: string;
  venue?: string;
  price?: string;
  couple?: string;
  planner?: string;
  drinks?: string;
  tableMapUrl?: string; // base64 桌位配置圖（同步用）
}

// 前一天準備清單
interface PreparationItem {
  eventId: string;
  item: string;
  assignee: string;
  description: string;
  completed: boolean;
}

// 外場/內場人員
interface StaffMember {
  eventId: string;
  name: string;
  dayPosition: string; // 當天崗位
  team: '外場' | '內場' | '其他';
  arrival: string;
  departure: string;
  note: string;
  attendance?: '未確認' | 'O' | 'X'; // 出勤狀態
}

// 外場/內場任務
interface Task {
  eventId: string;
  name: string;
  assignee: string;
  time: string;
  team: '外場' | '內場' | '其他';
  completed: boolean;
}

// 桌位配置圖片（僅存 localStorage，不同步）
interface TableLayoutImage {
  eventId: string;
  imageBase64: string;
  note: string;
}

// 圓桌/IBM桌擺放
interface TablePlacement {
  eventId: string;
  tableNumber: string;
  tableType: '圓桌' | 'IBM桌' | '長桌' | '吧台';
  location: string;
  capacity: string;
  note: string;
}

// 人員當日時間表
interface PersonalScheduleItem {
  eventId: string;
  staffName: string;
  time: string;
  task: string;
}

interface BudgetItem {
  eventId: string;
  name: string;
  estimated: string;
  actual: string;
  note: string;
}

interface ScheduleItem {
  eventId: string;
  time: string;
  content: string;
}

interface MenuItem {
  eventId: string;
  item: string;
  quantity: string;
  note: string;
  kitchenConfirmed: boolean;
  photoUrl?: string; // base64 照片
}

interface Note {
  eventId: string;
  content: string;
}

interface Remark {
  eventId: string;
  content: string;
}

interface EventAssignment {
  status: '-' | 'O' | 'X';
  arrival?: string;
  departure?: string;
}

interface GlobalStaff {
  name: string;
  team: '外場' | '內場' | '其他';
  note: string;
  photoUrl?: string;
  eventAssignments: { [eventId: string]: EventAssignment };
}

interface GlobalTask {
  label: string;
  checked: boolean;
}

interface ScheduleData {
  events: Event[];
  schedules: ScheduleItem[];
  menus: MenuItem[];
  notes: Note[];
  preparationItems: PreparationItem[];
  staffMembers: StaffMember[];
  tasks: Task[];
  tablePlacementItems: TablePlacement[];
  personalSchedules: PersonalScheduleItem[];
  budgets: BudgetItem[];
  remarks: Remark[];
  preparationTitle: string;
  preparationItemsGlobal: string[];
  globalStaff: GlobalStaff[];
  globalTasks: GlobalTask[];
  settingsTitle: string;
}

const initialData: ScheduleData = {
  events: [
    {
      eventId: 'evt_37',
      name: '3/7晚宴',
      date: '2026-03-07',
      timeSlot: '17:00-21:00',
      scale: '130人',
      status: '進行中',
      icon: '🎊',
      venue: '信義區 A Beach 101',
      price: 'NT$150,000',
    },
    {
      eventId: 'evt_38',
      name: '3/8午宴',
      date: '2026-03-08',
      timeSlot: '11:00-15:00',
      scale: '113+2+8人',
      status: '進行中',
      icon: '💍',
      venue: '信義區 A Beach 101',
      price: 'NT$100,000',
      couple: '陳彥賓 & 馬郁涵',
      planner: '樂樂 0958-289-113',
      drinks: '紅酒 × 6、白酒 × 6',
    },
    {
      eventId: 'evt_315',
      name: '3/15午宴',
      date: '2026-03-15',
      timeSlot: '10:45-15:00',
      scale: '88+6+5人',
      status: '進行中',
      icon: '💐',
      venue: '信義區 A Beach 101',
      couple: '新人姓名',
      planner: '婚顧聯絡人',
      drinks: '飲品資訊',
    },
  ],

  schedules: [
    { eventId: 'evt_37', time: '14:30', content: '新娘化妝（員工休息室，不可進出）' },
    { eventId: 'evt_37', time: '16:30', content: '戶外佈置，水杯130個，零食湯碗50個' },
    { eventId: 'evt_37', time: '18:30', content: '🎙開場誓詞（18:30-18:50不可走動）' },
    { eventId: 'evt_37', time: '19:00', content: '主菜上桌' },
    { eventId: 'evt_37', time: '20:30', content: '送客' },
    { eventId: 'evt_38', time: '10:00', content: '場地佈置' },
    { eventId: 'evt_38', time: '11:00', content: '賓客入場' },
    { eventId: 'evt_38', time: '11:30', content: '開場' },
    { eventId: 'evt_38', time: '14:00', content: '送客' },
    { eventId: 'evt_315', time: '10:00', content: '場地準備' },
    { eventId: 'evt_315', time: '10:45', content: '賓客入場' },
    { eventId: 'evt_315', time: '14:30', content: '活動結束' },
  ],

  menus: [
    { eventId: 'evt_37', item: '套餐說明待補充', quantity: '', note: '', kitchenConfirmed: false },
    { eventId: 'evt_38', item: '爐烤牛排', quantity: '73', note: '', kitchenConfirmed: true },
    { eventId: 'evt_38', item: '肋眼豬排', quantity: '23', note: '全熟', kitchenConfirmed: true },
    { eventId: 'evt_38', item: '素食餐點', quantity: '2', note: '', kitchenConfirmed: false },
    { eventId: 'evt_315', item: '牛排', quantity: '60', note: '', kitchenConfirmed: false },
    { eventId: 'evt_315', item: '豬排', quantity: '28', note: '', kitchenConfirmed: false },
  ],

  notes: [
    { eventId: 'evt_37', content: '🥗 蛋奶素1位坐L7' },
    { eventId: 'evt_37', content: '🪑 主桌G3，IBM桌×3' },
    { eventId: 'evt_37', content: '👷 工作人員餐盒9份' },
  ],

  preparationItems: [
    { eventId: 'evt_37', item: '確認場地電源', assignee: '工程組', description: '所有插座功能正常', completed: false },
    { eventId: 'evt_37', item: '備品清點', assignee: '外場', description: '水杯130個、餐具套組', completed: true },
    { eventId: 'evt_37', item: '菜單列印', assignee: '行政', description: '列印15份', completed: false },
    { eventId: 'evt_38', item: '確認音響設備', assignee: '技術組', description: '麥克風、音響測試', completed: false },
    { eventId: 'evt_38', item: '場地清潔', assignee: '外場', description: '全場地打掃', completed: false },
  ],

  staffMembers: [
    { eventId: 'evt_37', name: '張良瑋', dayPosition: '外場領班', team: '外場', arrival: '16:00', departure: '22:00', note: '全場督導' },
    { eventId: 'evt_37', name: '外場組長', dayPosition: '外場服務員', team: '外場', arrival: '16:30', departure: '21:30', note: '' },
    { eventId: 'evt_37', name: '廚師長', dayPosition: '內場主廚', team: '內場', arrival: '15:00', departure: '21:00', note: '負責主菜' },
    { eventId: 'evt_38', name: '值班經理', dayPosition: '外場領班', team: '外場', arrival: '09:30', departure: '15:00', note: '' },
  ],

  tasks: [
    { eventId: 'evt_37', name: '場地佈置確認', assignee: '張良瑋', time: '16:00', team: '外場', completed: true },
    { eventId: 'evt_37', name: '水杯備齊130個', assignee: '外場組', time: '16:30', team: '外場', completed: false },
    { eventId: 'evt_37', name: '素食餐點確認', assignee: '廚房', time: '17:00', team: '內場', completed: false },
    { eventId: 'evt_38', name: '檢查音響設備', assignee: '技術組', time: '10:00', team: '外場', completed: false },
  ],

  tablePlacementItems: [
    { eventId: 'evt_37', tableNumber: 'A1', tableType: '圓桌', location: '靠窗區', capacity: '10', note: '主桌' },
    { eventId: 'evt_37', tableNumber: 'B1', tableType: 'IBM桌', location: '中央區', capacity: '8', note: 'IBM團隊' },
    { eventId: 'evt_37', tableNumber: 'C1', tableType: '長桌', location: '後方', capacity: '12', note: '親友團' },
    { eventId: 'evt_38', tableNumber: 'M1', tableType: '圓桌', location: '主舞台前', capacity: '12', note: '' },
  ],

  personalSchedules: [
    { eventId: 'evt_37', staffName: '張良瑋', time: '16:00', task: '抵達現場，全場檢查' },
    { eventId: 'evt_37', staffName: '張良瑋', time: '17:00', task: '迎賓準備' },
    { eventId: 'evt_37', staffName: '外場組長', time: '16:30', task: '水杯擺設' },
    { eventId: 'evt_37', staffName: '外場組長', time: '18:00', task: '協助引導賓客' },
  ],

  budgets: [
    { eventId: 'evt_37', name: '場地費', estimated: '50000', actual: '50000', note: '已付訂金' },
    { eventId: 'evt_37', name: '佈置費用', estimated: '15000', actual: '16500', note: '' },
    { eventId: 'evt_37', name: '餐點費用', estimated: '85000', actual: '83500', note: '' },
    { eventId: 'evt_38', name: '場地費', estimated: '40000', actual: '', note: '' },
    { eventId: 'evt_38', name: '餐點費用', estimated: '60000', actual: '', note: '' },
  ],

  remarks: [
    { eventId: 'evt_37', content: '新娘對花卉過敏，避免使用百合\n主桌需要特別準備無酒精飲料' },
    { eventId: 'evt_38', content: '' },
    { eventId: 'evt_315', content: '' },
  ],

  preparationTitle: '⚑前置重要事項',
  preparationItemsGlobal: ['3/6 喜餅送達', '3/7 新人入住'],

  globalStaff: [
    { name: '張良瑋', team: '外場', note: '店長', eventAssignments: { 
      evt_37: { status: 'O', arrival: '16:00', departure: '22:00' }, 
      evt_38: { status: 'O', arrival: '09:30', departure: '15:00' }, 
      evt_315: { status: 'O', arrival: '10:00', departure: '15:00' } 
    } },
    { name: '員工A', team: '外場', note: '', eventAssignments: { 
      evt_37: { status: '-' }, 
      evt_38: { status: 'O', arrival: '10:00', departure: '14:00' }, 
      evt_315: { status: 'O', arrival: '10:00', departure: '14:00' } 
    } },
    { name: '員工B', team: '內場', note: '', eventAssignments: { 
      evt_37: { status: 'O', arrival: '15:00', departure: '21:00' }, 
      evt_38: { status: '-' }, 
      evt_315: { status: 'O', arrival: '09:00', departure: '14:00' } 
    } },
    { name: '員工C', team: '其他', note: '', eventAssignments: { 
      evt_37: { status: 'O', arrival: '16:00', departure: '21:00' }, 
      evt_38: { status: 'O', arrival: '10:00', departure: '14:00' }, 
      evt_315: { status: '-' } 
    } },
  ],

  globalTasks: [
    { label: '吧台：酒水杯具數量確認', checked: false },
    { label: '外場：130個水杯準備', checked: true },
    { label: '廚房：食材備貨檢查', checked: false },
  ],

  settingsTitle: '系統設定',
};

export default function App() {
  const [data, setData] = useState<ScheduleData>(initialData);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [saved, setSaved] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [tableLayoutImages, setTableLayoutImages] = useState<TableLayoutImage[]>([]);
  const [expandedStaff, setExpandedStaff] = useState<{ [key: string]: boolean }>({});
  const [gasUrl, setGasUrl] = useState<string>('');
  const [gasUrlInput, setGasUrlInput] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  // Quick add staff form state
  const [quickAddMode, setQuickAddMode] = useState<'library' | 'manual'>('library');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPosition, setQuickAddPosition] = useState('');
  const [quickAddTeam, setQuickAddTeam] = useState<'外場' | '內場' | '其他'>('外場');
  const [quickAddArrival, setQuickAddArrival] = useState('10:00');
  const [quickAddDeparture, setQuickAddDeparture] = useState('22:00');
  const [quickAddArea, setQuickAddArea] = useState('');
  const [positionError, setPositionError] = useState(false);
  const [duplicateStaffError, setDuplicateStaffError] = useState(false);
  
  // Real-time sync state
  const [isRealTimeSyncing, setIsRealTimeSyncing] = useState(false);
  const [realTimeSyncStatus, setRealTimeSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [realTimeSyncError, setRealTimeSyncError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  // New event form state
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTimeSlot, setNewEventTimeSlot] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventStatus, setNewEventStatus] = useState<string>('規劃中');

  // Auto-sync state
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncVersion, setLastSyncVersion] = useState<string>('');
  const [autoSyncToast, setAutoSyncToast] = useState<string>('');
  
  // Quick add task form state
  const [quickAddTaskName, setQuickAddTaskName] = useState('');
  const [quickAddTaskAssignee, setQuickAddTaskAssignee] = useState('');
  const [quickAddTaskTime, setQuickAddTaskTime] = useState('');
  const [quickAddTaskTeam, setQuickAddTaskTeam] = useState<'外場' | '內場' | '其他'>('外場');

  // Copy event times state
  const [showCopyTimeDropdown, setShowCopyTimeDropdown] = useState<string | null>(null);

  // Add event column state
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [newEventColumnName, setNewEventColumnName] = useState('');
  const [newEventColumnDate, setNewEventColumnDate] = useState('');
  const [newEventColumnTimeSlot, setNewEventColumnTimeSlot] = useState('');

  // Track if component has mounted (to skip auto-sync on initial load)
  const isInitialMount = useRef(true);

  useEffect(() => {
  // 僅在瀏覽器環境執行（避免 Vercel 構建錯誤）
  if (typeof window === 'undefined') {
    return;
  }

  const savedData = localStorage.getItem('beach101-schedule');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      setData({
        ...initialData,
        ...parsed,
        events: parsed.events || initialData.events,
        schedules: parsed.schedules || initialData.schedules,
        menus: parsed.menus || initialData.menus,
        notes: parsed.notes || initialData.notes,
        preparationItems: parsed.preparationItems || initialData.preparationItems,
        staffMembers: parsed.staffMembers || initialData.staffMembers,
        tasks: parsed.tasks || initialData.tasks,
        tablePlacementItems: parsed.tablePlacementItems || initialData.tablePlacementItems,
        personalSchedules: parsed.personalSchedules || initialData.personalSchedules,
        budgets: parsed.budgets || initialData.budgets,
        remarks: parsed.remarks || initialData.remarks,
        globalStaff: parsed.globalStaff || initialData.globalStaff,
        globalTasks: parsed.globalTasks || initialData.globalTasks,
      });
    } catch (e) {
      console.error('Failed to load saved data');
    }
  }

  const savedImages = localStorage.getItem('beach101-table-images');
  // ... (rest of the code stays the same)
    if (savedImages) {
      try {
        setTableLayoutImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Failed to load table images');
      }
    }

    const savedDarkMode = localStorage.getItem('beach101-darkmode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    }

    const savedFontSize = localStorage.getItem('beach101-fontsize');
    if (savedFontSize) {
      setFontSize(parseFloat(savedFontSize));
    }

    const savedGasUrl = localStorage.getItem('beach101-gas-url');
    if (savedGasUrl) {
      setGasUrl(savedGasUrl);
      setGasUrlInput(savedGasUrl);
    }

    const savedAutoSync = localStorage.getItem('autoSyncEnabled');
    if (savedAutoSync === 'true') {
      setAutoSync(true);
    }

    const savedSyncVersion = localStorage.getItem('lastSyncVersion');
    if (savedSyncVersion) {
      setLastSyncVersion(savedSyncVersion);
    }
  }, []);

  // Load initial data from Google Sheets on page mount
  useEffect(() => {
    const savedGasUrl = localStorage.getItem('beach101-gas-url');
    if (!savedGasUrl) {
      // No GAS URL, enable auto-sync after initial mount
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
      return;
    }

    fetch(savedGasUrl)
      .then(r => r.json())
      .then(res => {
        if (res.status === 'ok' && res.data) {
          // Override data state with latest from Google Sheets
          // Ensure all required arrays exist
          const loadedData = {
            ...initialData,
            ...res.data,
            events: res.data.events || initialData.events,
            staffMembers: res.data.staffMembers || initialData.staffMembers,
            globalStaff: res.data.globalStaff || initialData.globalStaff,
          };
          setData(loadedData);
          setSyncStatus('✅ 已從 Google Sheets 載入最新資料');
          setTimeout(() => setSyncStatus(''), 3000);
        }
      })
      .catch(err => {
        console.error('初始載入失敗', err);
        setSyncStatus('⚠️ 無法從 Google Sheets 載入資料，使用本地資料');
        setTimeout(() => setSyncStatus(''), 3000);
      })
      .finally(() => {
        // Enable auto-sync after initial load completes
        setTimeout(() => {
          isInitialMount.current = false;
        }, 100);
      });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-sync on data change
  useEffect(() => {
    if (isInitialMount.current) {
      return; // Skip auto-sync on initial mount
    }

    // Only trigger auto-sync if data is valid
    if (data && data.events && data.staffMembers) {
      autoSyncToSheet(data);
    }
  }, [data]);

  // Auto-polling mechanism
  useEffect(() => {
    if (!autoSync || !gasUrl) return;

    const intervalId = setInterval(async () => {
      try {
        // Check if online before attempting sync
        if (!navigator.onLine) {
          return; // Skip sync if offline
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${gasUrl}?action=getData`, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`Auto-sync: Server responded with status ${response.status}`);
          return;
        }
        
        const result = await response.json();
        
        if (result && result.success !== false) {
          const importedData = result.data || result;
          const remoteVersion = result.version || importedData.version;
          
          // Check if remote version is newer
          if (remoteVersion && lastSyncVersion && remoteVersion > lastSyncVersion) {
            // Remote data is newer, update local state
            setData({
              ...initialData,
              ...importedData,
            });
            localStorage.setItem('beach101-schedule', JSON.stringify(importedData));
            setLastSyncVersion(remoteVersion);
            localStorage.setItem('lastSyncVersion', remoteVersion);
            
            // Show toast notification
            setAutoSyncToast(`📡 偵測到遠端更新，已自動同步`);
            setTimeout(() => setAutoSyncToast(''), 2000);
          } else if (remoteVersion && !lastSyncVersion) {
            // First time sync, just update version
            setLastSyncVersion(remoteVersion);
            localStorage.setItem('lastSyncVersion', remoteVersion);
          }
          // Remove the else block that shows toast on every sync to reduce noise
        }
      } catch (error: any) {
        // Handle different types of errors silently
        if (error.name === 'AbortError') {
          console.warn('Auto-sync: Request timeout');
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          console.warn('Auto-sync: Network request failed (offline or CORS issue)');
        } else {
          console.warn('Auto-sync: Failed with error:', error.message);
        }
        // All errors are handled silently to avoid disrupting user experience
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [autoSync, gasUrl, lastSyncVersion]);

  // Close copy time dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.copy-time-dropdown-container')) {
        setShowCopyTimeDropdown(null);
      }
    };

    if (showCopyTimeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCopyTimeDropdown]);

  const handleSave = () => {
    localStorage.setItem('beach101-schedule', JSON.stringify(data));
    localStorage.setItem('beach101-table-images', JSON.stringify(tableLayoutImages));
    localStorage.setItem('beach101-darkmode', darkMode.toString());
    localStorage.setItem('beach101-fontsize', fontSize.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    if (confirm('確定要清除所有資料嗎？')) {
      setData(initialData);
      setTableLayoutImages([]);
      localStorage.removeItem('beach101-schedule');
      localStorage.removeItem('beach101-table-images');
    }
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 0.125, 1.5));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 0.125, 0.75));
  };

          setData(syncedData);
          localStorage.setItem('beach101-schedule', JSON.stringify(syncedData));
        }
      }
      
      setSyncStatus('✓ 雙向同步完成！');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(`✗ 同步失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
      setTimeout(() => setSyncStatus(''), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save GAS URL
  const handleSaveGasUrl = () => {
    if (!gasUrlInput.trim()) {
      alert('請輸入 GAS Web App URL');
      return;
    }
    setGasUrl(gasUrlInput);
    localStorage.setItem('beach101-gas-url', gasUrlInput);
    setSyncStatus('✅ URL 已儲存');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  // Sync to Google Sheets
  const handleSyncToSheets = async () => {
    if (!gasUrl) {
      alert('請先設定 GAS Web App URL');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('同步中...');
    
    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const now = new Date().toLocaleString('zh-TW', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setLastSyncTime(now);
      setSyncStatus(`✅ 同步成功 ${now}`);
      setTimeout(() => setSyncStatus(''), 5000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('❌ 同步失敗，請確認 URL');
      setTimeout(() => setSyncStatus(''), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  /*
   * ========== GAS (Google Apps Script) 端對應調整說明 ==========
   * 
   * 為了支援版本控制與自動同步，GAS 端需要：
   * 
   * 1. POST (即時同步) 回應中加入 version 欄位：
   *    - 每次 POST 成功時，GAS 回傳一個 ISO 時間戳作為 version
   *    - 範例：{ "success": true, "version": "2026-03-05T10:30:15.123Z" }
   * 
   * 2. GET (拉取資料) 回應中加入 version 欄位：
   *    - 每次 GET 時，GAS 回傳最後一次更新的時間戳
   *    - 範例：{ "success": true, "data": {...}, "version": "2026-03-05T10:30:15.123Z" }
   * 
   * 3. 前端會比較 version，若遠端較新則自動覆蓋本地資料
   * 
   * ========== writeEventSheet 函數更新說明 ==========
   * 
   * 人員表格格式已更新為合併時段顯示，請在 GAS 端修改 writeEventSheet 函數：
   * 
   * 1. 外場人員區塊：
   *    標頭：['姓名', '崗位', '時段', '出勤', '組別', '備註']
   *    資料來源：event.processedStaff（前端已處理好的資料）
   *    欄位對應：
   *      - 姓名: staff.name
   *      - 崗位: staff.dayPosition
   *      - 時段: staff.timeRange (格式：'11:00～22:00')
   *      - 出勤: staff.attendance
   *      - 組別: staff.team
   *      - 備註: staff.note
   * 
   * 2. 內場人員區塊：
   *    標頭：['姓名', '崗位', '時段', '出勤', '備註']
   *    欄位對應：
   *      - 姓名: staff.name
   *      - 崗位: staff.dayPosition
   *      - 時段: staff.timeRange (格式：'11:00～22:00')
   *      - 出勤: staff.attendance
   *      - 備註: staff.note
   * 
   * 範例程式碼片段：
   * 
   *   // 外場人員
   *   const frontStaff = event.processedStaff.filter(s => s.team === '外場');
   *   if (frontStaff.length > 0) {
   *     sheet.appendRow(['外場人員']);
   *     sheet.appendRow(['姓名', '崗位', '時段', '出勤', '組別', '備註']);
   *     frontStaff.forEach(staff => {
   *       sheet.appendRow([
   *         staff.name,
   *         staff.dayPosition,
   *         staff.timeRange,           // '11:00～22:00' 格式
   *         staff.attendance,
   *         staff.team,
   *         staff.note
   *       ]);
   *     });
   *   }
   * 
   *   // 內場人員
   *   const backStaff = event.processedStaff.filter(s => s.team === '內場');
   *   if (backStaff.length > 0) {
   *     sheet.appendRow(['內場人員']);
   *     sheet.appendRow(['姓名', '崗位', '時段', '出勤', '備註']);
   *     backStaff.forEach(staff => {
   *       sheet.appendRow([
   *         staff.name,
   *         staff.dayPosition,
   *         staff.timeRange,           // '11:00～22:00' 格式
   *         staff.attendance,
   *         staff.note
   *       ]);
   *     });
   *   }
   */

  // Silent auto-sync function (no UI feedback)
  const autoSyncToSheet = async (updatedData: typeof data) => {
    if (!gasUrl) return; // Skip if no GAS URL configured
    if (!updatedData || !updatedData.events || !updatedData.staffMembers) return; // Skip if data is incomplete

    try {
      // Process data to add timeRange field for each event's staff
      const processedData = {
        ...updatedData,
        events: updatedData.events.map(event => {
          // Get staff for this event
          const eventStaff = (updatedData.staffMembers || [])
            .filter(s => s.eventId === event.eventId)
            .map(staff => ({
              ...staff,
              // Add timeRange field combining arrival and departure
              timeRange: `${staff.arrival || ''}～${staff.departure || ''}`
            }));

          return {
            ...event,
            // Include processed staff in the event payload
            processedStaff: eventStaff
          };
        })
      };

      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'realTimeSync',
          data: processedData
        }),
      });
    } catch (error) {
      console.error('Auto-sync error:', error);
      // Silent failure - don't show error to user
    }
  };

  // Real-time sync - push current state to Sheets
  const handleRealTimeSync = async () => {
    if (!gasUrl) {
      setRealTimeSyncStatus('error');
      setRealTimeSyncError('請先至設定頁填入 GAS URL');
      setTimeout(() => {
        setActiveTab('settings');
      }, 1500);
      setTimeout(() => {
        setRealTimeSyncStatus('idle');
        setRealTimeSyncError('');
      }, 3000);
      return;
    }

    setIsRealTimeSyncing(true);
    setRealTimeSyncStatus('syncing');
    setRealTimeSyncError('');
    
    try {
      // Process data to add timeRange field for each event's staff
      const processedData = {
        ...data,
        events: (data.events || []).map(event => {
          // Get staff for this event
          const eventStaff = (data.staffMembers || [])
            .filter(s => s.eventId === event.eventId)
            .map(staff => ({
              ...staff,
              // Add timeRange field combining arrival and departure
              timeRange: `${staff.arrival || ''}～${staff.departure || ''}`
            }));

          return {
            ...event,
            // Include processed staff in the event payload
            processedStaff: eventStaff
          };
        })
      };

      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'realTimeSync',
          data: processedData
        }),
      });
      
      setRealTimeSyncStatus('success');
      const now = new Date().toLocaleString('zh-TW', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setLastSyncTime(now);
      
      setTimeout(() => {
        setRealTimeSyncStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Real-time sync error:', error);
      setRealTimeSyncStatus('error');
      setRealTimeSyncError('同步失敗，請檢查網路連線');
      setTimeout(() => {
        setRealTimeSyncStatus('idle');
        setRealTimeSyncError('');
      }, 3000);
    } finally {
      setIsRealTimeSyncing(false);
    }
  };

  // Import from Google Sheets
  const handleImportFromSheets = async () => {
    if (!gasUrl) {
      setSyncStatus('⚠️ 請先設定 GAS Web App URL');
      setTimeout(() => setSyncStatus(''), 3000);
      return;
    }

    setIsImporting(true);
    setSyncStatus('📥 匯入中...');
    
    try {
      const response = await fetch(`${gasUrl}?action=getData`);
      if (!response.ok) {
        throw new Error('無法連接到 Google Sheets');
      }
      
      const result = await response.json();
      
      if (result && result.success !== false) {
        const importedData = result.data || result;
        const remoteVersion = result.version || importedData.version;
        
        setData({
          ...initialData,
          ...importedData,
        });
        localStorage.setItem('beach101-schedule', JSON.stringify(importedData));
        
        // Update version if available
        if (remoteVersion) {
          setLastSyncVersion(remoteVersion);
          localStorage.setItem('lastSyncVersion', remoteVersion);
        }
        
        const eventCount = importedData.events?.length || 0;
        setSyncStatus(`✅ 匯入完成，共載入 ${eventCount} 個場次`);
        setTimeout(() => setSyncStatus(''), 5000);
      } else {
        throw new Error('匯入失敗');
      }
    } catch (error) {
      console.error('Import error:', error);
      setSyncStatus('❌ 匯入失敗，請確認 URL 與網路連線');
      setTimeout(() => setSyncStatus(''), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  // Clear all data
  const handleClearAllData = () => {
    if (window.confirm('確定要清除所有場次與人員資料嗎？此操作無法復原')) {
      setData(initialData);
      localStorage.removeItem('beach101-schedule');
      setSyncStatus('✅ 已清除所有資料');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  // Toggle auto-sync
  const handleToggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('autoSyncEnabled', newValue.toString());
  };

  // Copy event times from source to target
  const handleCopyEventTimes = (sourceEventId: string, targetEventId: string) => {
    const newStaff = (data.globalStaff || []).map(person => {
      const sourceAssignment = person.eventAssignments[sourceEventId];
      if (!sourceAssignment || sourceAssignment.status !== 'O') {
        return person;
      }
      
      return {
        ...person,
        eventAssignments: {
          ...person.eventAssignments,
          [targetEventId]: {
            ...person.eventAssignments[targetEventId],
            arrival: sourceAssignment.arrival,
            departure: sourceAssignment.departure
          }
        }
      };
    });
    
    setData(prev => ({ ...prev, globalStaff: newStaff }));
    setShowCopyTimeDropdown(null);
    
    const sourceEvent = data.events.find(e => e.eventId === sourceEventId);
    const targetEvent = data.events.find(e => e.eventId === targetEventId);
    setSyncStatus(`✅ 已複製 ${sourceEvent?.name} 的時間到 ${targetEvent?.name}`);
    setTimeout(() => setSyncStatus(''), 3000);
  };

  // Add new event column to staff table
  const handleAddEventColumn = () => {
    if (!newEventColumnName || !newEventColumnDate) {
      alert('請填寫活動名稱和日期');
      return;
    }

    // Generate new event ID
    const newEventId = `event-${Date.now()}`;

    // Create new event
    const newEvent = {
      eventId: newEventId,
      name: newEventColumnName,
      date: newEventColumnDate,
      timeSlot: newEventColumnTimeSlot || '',
      location: '',
      attendees: 0,
      budget: 0,
      tasks: [],
      menu: []
    };

    // Update all staff members with default assignment for this event
    const newStaff = (data.globalStaff || []).map(person => ({
      ...person,
      eventAssignments: {
        ...person.eventAssignments,
        [newEventId]: {
          status: 'O' as const,
          arrival: '10:00',
          departure: '22:00'
        }
      }
    }));

    // Add event and update staff
    setData(prev => ({ 
      ...prev, 
      events: [...prev.events, newEvent],
      globalStaff: newStaff 
    }));
    
    setShowAddEventDialog(false);
    setNewEventColumnName('');
    setNewEventColumnDate('');
    setNewEventColumnTimeSlot('');
    
    setSyncStatus(`✅ 已新增場次：${newEventColumnName} (${newEventColumnDate})`);
    setTimeout(() => setSyncStatus(''), 3000);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beach101-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Update functions
  const updateEvent = (eventId: string, updates: Partial<Event>) => {
    setData(prev => ({
      ...prev,
      events: (prev.events || []).map(e => e.eventId === eventId ? { ...e, ...updates } : e),
    }));
  };

  const addEvent = () => {
    if (!newEventDate || !newEventName) return;
    
    const newEventId = `evt_${Date.now()}`;
    const newEvent: Event = {
      eventId: newEventId,
      name: newEventName,
      date: newEventDate,
      timeSlot: newEventTimeSlot || '10:00-22:00',
      scale: '待確認',
      status: newEventStatus,
      icon: '📅',
    };

    setData(prev => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));

    // Reset form
    setNewEventDate('');
    setNewEventTimeSlot('');
    setNewEventName('');
    setNewEventStatus('規劃中');
  };

  const removeEvent = (eventId: string) => {
    if (!confirm('確定要刪除此場次嗎？所有相關資料（員工、任務、菜單等）都將被刪除。')) return;

    setData(prev => {
      // Remove eventId from all staff members' eventAssignments
      const updatedGlobalStaff = prev.globalStaff.map(person => {
        const newAssignments = { ...person.eventAssignments };
        delete newAssignments[eventId];
        return {
          ...person,
          eventAssignments: newAssignments
        };
      });

      return {
        ...prev,
        events: prev.events.filter(e => e.eventId !== eventId),
        schedules: prev.schedules.filter(s => s.eventId !== eventId),
        menus: prev.menus.filter(m => m.eventId !== eventId),
        notes: prev.notes.filter(n => n.eventId !== eventId),
        preparationItems: prev.preparationItems.filter(p => p.eventId !== eventId),
        staffMembers: prev.staffMembers.filter(s => s.eventId !== eventId),
        tasks: prev.tasks.filter(t => t.eventId !== eventId),
        tablePlacementItems: prev.tablePlacementItems.filter(t => t.eventId !== eventId),
        personalSchedules: prev.personalSchedules.filter(p => p.eventId !== eventId),
        budgets: prev.budgets.filter(b => b.eventId !== eventId),
        remarks: prev.remarks.filter(r => r.eventId !== eventId),
        globalStaff: updatedGlobalStaff
      };
    });

    // Switch to overview if current tab is deleted event
    if (activeTab === eventId) {
      setActiveTab('overview');
    }
  };

  const updateSchedules = (eventId: string, newSchedules: ScheduleItem[]) => {
    setData(prev => ({
      ...prev,
      schedules: [
        ...prev.schedules.filter(s => s.eventId !== eventId),
        ...newSchedules,
      ],
    }));
  };

  const updateMenus = (eventId: string, newMenus: MenuItem[]) => {
    setData(prev => ({
      ...prev,
      menus: [
        ...prev.menus.filter(m => m.eventId !== eventId),
        ...newMenus,
      ],
    }));
  };

  const updateNotes = (eventId: string, newNotes: Note[]) => {
    setData(prev => ({
      ...prev,
      notes: [
        ...prev.notes.filter(n => n.eventId !== eventId),
        ...newNotes,
      ],
    }));
  };

  const updatePreparationItems = (eventId: string, newItems: PreparationItem[]) => {
    setData(prev => ({
      ...prev,
      preparationItems: [
        ...prev.preparationItems.filter(p => p.eventId !== eventId),
        ...newItems,
      ],
    }));
  };

  const updateStaffMembers = (eventId: string, newStaff: StaffMember[]) => {
    setData(prev => ({
      ...prev,
      staffMembers: [
        ...prev.staffMembers.filter(s => s.eventId !== eventId),
        ...newStaff,
      ],
    }));
  };

  const updateTasks = (eventId: string, newTasks: Task[]) => {
    setData(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks.filter(t => t.eventId !== eventId),
        ...newTasks,
      ],
    }));
  };

  const updateTablePlacements = (eventId: string, newPlacements: TablePlacement[]) => {
    setData(prev => ({
      ...prev,
      tablePlacementItems: [
        ...prev.tablePlacementItems.filter(t => t.eventId !== eventId),
        ...newPlacements,
      ],
    }));
  };

  const updatePersonalSchedules = (eventId: string, newSchedules: PersonalScheduleItem[]) => {
    setData(prev => ({
      ...prev,
      personalSchedules: [
        ...prev.personalSchedules.filter(p => p.eventId !== eventId),
        ...newSchedules,
      ],
    }));
  };

  const handleQuickAddTask = (eventId: string) => {
    if (!quickAddTaskName.trim()) return;
    
    const newTask: Task = {
      eventId,
      name: quickAddTaskName.trim(),
      assignee: quickAddTaskAssignee,
      time: quickAddTaskTime,
      team: quickAddTaskTeam,
      completed: false
    };

    updateTasks(eventId, [...data.tasks.filter(t => t.eventId === eventId), newTask]);
    
    // Reset form
    setQuickAddTaskName('');
    setQuickAddTaskAssignee('');
    setQuickAddTaskTime('');
  };

  const updateBudgets = (eventId: string, newBudgets: BudgetItem[]) => {
    setData(prev => ({
      ...prev,
      budgets: [
        ...prev.budgets.filter(b => b.eventId !== eventId),
        ...newBudgets,
      ],
    }));
  };

  const updateRemark = (eventId: string, content: string) => {
    setData(prev => ({
      ...prev,
      remarks: [
        ...prev.remarks.filter(r => r.eventId !== eventId),
        { eventId, content },
      ],
    }));
  };

  const updateTableLayoutImage = (eventId: string, imageBase64: string, note: string) => {
    setTableLayoutImages(prev => [
      ...prev.filter(img => img.eventId !== eventId),
      { eventId, imageBase64, note },
    ]);
  };

  const handleImageUpload = (eventId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const currentImage = tableLayoutImages.find(img => img.eventId === eventId);
      updateTableLayoutImage(eventId, base64, currentImage?.note || '');
      // Also sync tableMapUrl into the event for Google Sheets payload
      updateEvent(eventId, { tableMapUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  // Generate time options (06:00 - 24:00, 30min intervals)
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 6; hour <= 24; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 24) {
        times.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return times;
  };

  // Get available staff library for a specific event (only those with status 'O')
  const getStaffLibrary = (eventId?: string) => {
    if (!eventId) {
      // Return all staff for general use
      return (data.globalStaff || []).map(staff => ({
        name: staff.name,
        team: staff.team
      }));
    }
    
    // Filter only confirmed staff for specific event
    return data.globalStaff
      .filter(staff => {
        const assignment = staff.eventAssignments[eventId];
        return assignment && assignment.status === 'O';
      })
      .map(staff => ({
        name: staff.name,
        team: staff.team,
        arrival: staff.eventAssignments[eventId]?.arrival || '09:00',
        departure: staff.eventAssignments[eventId]?.departure || '17:00'
      }));
  };

  // Quick add staff handler
  const handleQuickAddStaff = (eventId: string) => {
    if (!quickAddName.trim()) return;
    if (!quickAddPosition.trim()) {
      setPositionError(true);
      return;
    }
    setPositionError(false);

    // Check for duplicate
    const alreadyExists = data.staffMembers.some(
      s => s.eventId === eventId && s.name === quickAddName.trim()
    );
    if (alreadyExists) {
      setDuplicateStaffError(true);
      return;
    }
    setDuplicateStaffError(false);
    
    const newStaff: StaffMember = {
      eventId,
      name: quickAddName.trim(),
      dayPosition: quickAddPosition,
      team: quickAddTeam,
      arrival: quickAddArrival,
      departure: quickAddDeparture,
      note: quickAddArea,
      attendance: '未確認'
    };

    updateStaffMembers(eventId, [...data.staffMembers.filter(s => s.eventId === eventId), newStaff]);
    
    // Reset form (keep time settings)
    setQuickAddName('');
    setQuickAddArea('');
    setQuickAddPosition('');
    setDuplicateStaffError(false);
  };

  // Import tasks into personal schedule for a staff member
  const handleImportTasksToPersonalSchedule = (eventId: string, staffName: string) => {
    const relatedTasks = data.tasks.filter(t => t.eventId === eventId && t.assignee === staffName);

    if (relatedTasks.length === 0) {
      alert(`「${staffName}」在任務清單中沒有被指派任何任務`);
      return;
    }

    const existingSchedules = getPersonalSchedulesByEvent(eventId, staffName);

    const newItems: PersonalScheduleItem[] = [];
    relatedTasks.forEach(task => {
      const alreadyExists = existingSchedules.some(
        s => s.time === task.time && s.task === task.name
      );
      if (!alreadyExists) {
        newItems.push({ eventId, staffName, time: task.time, task: task.name });
      }
    });

    if (newItems.length === 0) {
      alert('所有任務已存在於時間表中，無需重複新增');
      return;
    }

    updatePersonalSchedules(eventId, [
      ...data.personalSchedules.filter(p => p.eventId === eventId),
      ...newItems,
    ]);
  };

  // Handle staff selection from library (with event context)
  const handleStaffLibrarySelect = (value: string, eventId: string) => {
    const staffLibrary = getStaffLibrary(eventId);
    const selected = staffLibrary.find(s => s.name === value);
    if (selected) {
      setQuickAddName(selected.name);
      setQuickAddTeam(selected.team);
      // Auto-fill arrival and departure from library
      if ('arrival' in selected && 'departure' in selected) {
        setQuickAddArrival(selected.arrival || '09:00');
        setQuickAddDeparture(selected.departure || '17:00');
      }
      // dayPosition needs to be selected manually
    }
  };

  const positionOptions = [
    '外場領班', '外場服務員', '外場助理',
    '內場主廚', '內場副廚', '內場助理',
    '司儀', '場控', '攝影', '音控'
  ];

  const timeOptions = generateTimeOptions();

  // Toggle attendance status
  const toggleAttendance = (eventId: string, staff: StaffMember) => {
    const allStaff = data.staffMembers.filter(s => s.eventId === eventId);
    const idx = allStaff.findIndex(s => s === staff);
    if (idx === -1) return;

    const currentStatus = staff.attendance || '未確認';
    const nextStatus = currentStatus === '未確認' ? 'O' : currentStatus === 'O' ? 'X' : '未確認';
    
    allStaff[idx] = { ...allStaff[idx], attendance: nextStatus };
    updateStaffMembers(eventId, allStaff);
  };

  // Handle menu photo upload
  const handleMenuPhotoUpload = (eventId: string, menuIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const menus = getMenusByEvent(eventId);
      if (menus[menuIndex]) {
        menus[menuIndex] = { ...menus[menuIndex], photoUrl: base64 };
        updateMenus(eventId, menus);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear menu photo
  const clearMenuPhoto = (eventId: string, menuIndex: number) => {
    const menus = getMenusByEvent(eventId);
    if (menus[menuIndex]) {
      menus[menuIndex] = { ...menus[menuIndex], photoUrl: undefined };
      updateMenus(eventId, menus);
    }
  };

  // Get data by eventId
  const getSchedulesByEvent = (eventId: string) => data.schedules.filter(s => s.eventId === eventId);
  const getMenusByEvent = (eventId: string) => data.menus.filter(m => m.eventId === eventId);
  const getNotesByEvent = (eventId: string) => data.notes.filter(n => n.eventId === eventId);
  const getPreparationItemsByEvent = (eventId: string) => data.preparationItems.filter(p => p.eventId === eventId);
  const getStaffByEvent = (eventId: string, team?: '外場' | '內場') => {
    const staff = data.staffMembers.filter(s => s.eventId === eventId);
    return team ? staff.filter(s => s.team === team) : staff;
  };
  const getTasksByEvent = (eventId: string, team?: '外場' | '內場') => {
    const tasks = data.tasks.filter(t => t.eventId === eventId);
    return team ? tasks.filter(t => t.team === team) : tasks;
  };
  const getTablePlacementsByEvent = (eventId: string) => data.tablePlacementItems.filter(t => t.eventId === eventId);
  const getPersonalSchedulesByEvent = (eventId: string, staffName?: string) => {
    const schedules = data.personalSchedules.filter(p => p.eventId === eventId);
    return staffName ? schedules.filter(p => p.staffName === staffName) : schedules;
  };
  const getBudgetsByEvent = (eventId: string) => data.budgets.filter(b => b.eventId === eventId);
  const getRemarkByEvent = (eventId: string) => data.remarks.find(r => r.eventId === eventId)?.content || '';
  const getTableLayoutImage = (eventId: string) => tableLayoutImages.find(img => img.eventId === eventId);

  // Gantt Chart Component
  const GanttChart: React.FC<{
    event: Event;
    staff: Array<{ name: string; team: string; position: string; arrival: string; departure: string; area?: string }>;
    schedules: ScheduleItem[];
    tasks: Task[];
  }> = ({ event, staff, schedules, tasks }) => {
    const [ganttZoom, setGanttZoom] = useState(60); // pixels per 30min
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);
      return () => clearInterval(timer);
    }, []);

    // Calculate time range
    const calculateTimeRange = () => {
      let earliest = '08:00';
      let latest = '24:00';

      if (staff.length > 0) {
        const times = staff.flatMap(s => [s.arrival, s.departure]);
        const sortedTimes = times.sort();
        earliest = sortedTimes[0] || '08:00';
        latest = sortedTimes[sortedTimes.length - 1] || '24:00';
      }

      // Parse and adjust
      const [eH, eM] = earliest.split(':').map(Number);
      const [lH, lM] = latest.split(':').map(Number);
      
      const startHour = Math.max(0, eH - 1);
      const endHour = Math.min(24, lH + 2);

      return { startHour, endHour };
    };

    const { startHour, endHour } = calculateTimeRange();
    const totalSlots = (endHour - startHour) * 2; // 30min slots

    // Convert time string to pixel position
    const timeToPosition = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const totalMinutes = h * 60 + m;
      const startMinutes = startHour * 60;
      const slotIndex = (totalMinutes - startMinutes) / 30;
      return slotIndex * ganttZoom;
    };

    // Get current time position
    const getCurrentTimePosition = () => {
      const h = currentTime.getHours();
      const m = currentTime.getMinutes();
      if (h < startHour || h >= endHour) return null;
      const totalMinutes = h * 60 + m;
      const startMinutes = startHour * 60;
      return ((totalMinutes - startMinutes) / 30) * ganttZoom;
    };

    const currentTimePos = getCurrentTimePosition();

    // Group staff by team
    const frontStaff = staff.filter(s => s.team === '外場');
    const backStaff = staff.filter(s => s.team === '內場');

    return (
      <div className="mt-8 print:break-before-page">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">📊 當日甘特圖</h3>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => setGanttZoom(prev => Math.max(30, prev - 10))}
              className="px-3 py-1 bg-[#F8F9FA] dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded hover:bg-[#E0E0E0] dark:hover:bg-[#3C4E60] transition-colors text-sm"
            >
              🔍− 縮小
            </button>
            <button
              onClick={() => setGanttZoom(prev => Math.min(120, prev + 10))}
              className="px-3 py-1 bg-[#F8F9FA] dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded hover:bg-[#E0E0E0] dark:hover:bg-[#3C4E60] transition-colors text-sm"
            >
              🔍+ 放大
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#1E1E1E]">
          <div className="relative" style={{ minWidth: `${totalSlots * ganttZoom + 200}px` }}>
            {/* Background grid lines */}
            <div className="absolute top-0 bottom-0 left-[200px] right-0 pointer-events-none z-0">
              <div className="flex h-full">
                {Array.from({ length: totalSlots }).map((_, i) => (
                  <div
                    key={i}
                    className="border-l border-[#E5E5E5] dark:border-[#333]"
                    style={{ width: `${ganttZoom}px` }}
                  />
                ))}
              </div>
            </div>
            
            {/* Time axis */}
            <div className="flex sticky top-0 bg-[#F8F9FA] dark:bg-[#2C3E50] border-b-2 border-[#2C3E50] dark:border-[#3498DB] z-10">
              <div className="w-[200px] flex-shrink-0 p-2 font-semibold border-r border-[#DEE2E6] dark:border-[#333] sticky left-0 bg-[#F8F9FA] dark:bg-[#2C3E50] z-20 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                時間軸
              </div>
              <div className="flex">
                {Array.from({ length: totalSlots }).map((_, i) => {
                  const minutes = startHour * 60 + i * 30;
                  const h = Math.floor(minutes / 60);
                  const m = minutes % 60;
                  const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  return (
                    <div
                      key={i}
                      className="border-l border-[#E5E5E5] dark:border-[#333] text-xs text-center p-1"
                      style={{ width: `${ganttZoom}px` }}
                    >
                      {m === 0 && <span className="font-semibold">{timeLabel}</span>}
                      {m === 30 && <span className="text-[#999]">{timeLabel}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Schedule Block */}
            <div className="border-b-2 border-[#3498DB] dark:border-[#3498DB]">
              <div className="flex items-center bg-[#E8F4F8] dark:bg-[#1E3A47]">
                <div className="w-[200px] flex-shrink-0 p-3 font-semibold border-r border-[#DEE2E6] dark:border-[#333] sticky left-0 bg-[#E8F4F8] dark:bg-[#1E3A47] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                  🗓 活動流程
                </div>
                <div className="relative flex-1" style={{ height: '60px' }}>
                  {schedules.map((schedule, idx) => {
                    const startPos = timeToPosition(schedule.time);
                    const nextTime = schedules[idx + 1]?.time;
                    const width = nextTime ? timeToPosition(nextTime) - startPos : ganttZoom * 2;
                    return (
                      <div
                        key={idx}
                        className="absolute top-2 bg-[#3498DB] text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-[#2C7CB8] transition-colors"
                        style={{ left: `${startPos}px`, width: `${Math.max(width, ganttZoom)}px`, height: '40px' }}
                        title={`${schedule.time} - ${schedule.content}`}
                      >
                        <div className="truncate font-medium">{schedule.content}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Staff Schedule Block */}
            <div className="border-b-2 border-[#27AE60] dark:border-[#27AE60]">
              <div className="flex items-center bg-[#E8F5E9] dark:bg-[#1E3A1E]">
                <div className="w-[200px] flex-shrink-0 p-2 font-semibold border-b border-[#DEE2E6] dark:border-[#333] sticky left-0 bg-[#E8F5E9] dark:bg-[#1E3A1E] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                  👔 人員排班
                </div>
                <div className="flex-1 border-b border-[#DEE2E6] dark:border-[#333]"></div>
              </div>
              {frontStaff.length > 0 && (
                <>
                  <div className="flex items-center bg-[#F8F9FA] dark:bg-[#2C3E50]">
                    <div className="w-[200px] flex-shrink-0 px-3 py-1 text-xs text-[#666] dark:text-[#AAA] sticky left-0 bg-[#F8F9FA] dark:bg-[#2C3E50] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      外場人員
                    </div>
                    <div className="flex-1"></div>
                  </div>
                  {frontStaff.map((person, idx) => (
                    <div key={`front-${idx}`} className="flex items-center border-b border-[#DEE2E6] dark:border-[#333]">
                      <div className="w-[200px] flex-shrink-0 p-2 text-sm border-r border-[#DEE2E6] dark:border-[#333] sticky left-0 bg-white dark:bg-[#1E1E1E] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                        {person.name}
                      </div>
                      <div className="relative flex-1" style={{ height: '40px' }}>
                        <div
                          className="absolute top-1 bg-[#27AE60] text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-[#229954] transition-colors"
                          style={{
                            left: `${timeToPosition(person.arrival)}px`,
                            width: `${timeToPosition(person.departure) - timeToPosition(person.arrival)}px`,
                            height: '30px'
                          }}
                          title={`${person.name} · ${person.position}\n到場：${person.arrival} / 離場：${person.departure}`}
                        >
                          <div className="truncate">{person.name} · {person.position}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {backStaff.length > 0 && (
                <>
                  <div className="flex items-center bg-[#F8F9FA] dark:bg-[#2C3E50]">
                    <div className="w-[200px] flex-shrink-0 px-3 py-1 text-xs text-[#666] dark:text-[#AAA] sticky left-0 bg-[#F8F9FA] dark:bg-[#2C3E50] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      內場人員
                    </div>
                    <div className="flex-1"></div>
                  </div>
                  {backStaff.map((person, idx) => (
                    <div key={`back-${idx}`} className="flex items-center border-b border-[#DEE2E6] dark:border-[#333]">
                      <div className="w-[200px] flex-shrink-0 p-2 text-sm border-r border-[#DEE2E6] dark:border-[#333] sticky left-0 bg-white dark:bg-[#1E1E1E] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                        {person.name}
                      </div>
                      <div className="relative flex-1" style={{ height: '40px' }}>
                        <div
                          className="absolute top-1 bg-[#E67E22] text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-[#D35400] transition-colors"
                          style={{
                            left: `${timeToPosition(person.arrival)}px`,
                            width: `${timeToPosition(person.departure) - timeToPosition(person.arrival)}px`,
                            height: '30px'
                          }}
                          title={`${person.name} · ${person.position}\n到場：${person.arrival} / 離場：${person.departure}`}
                        >
                          <div className="truncate">{person.name} · {person.position}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Tasks Block */}
            {tasks.length > 0 && (
              <div className="border-b border-[#DEE2E6] dark:border-[#333]">
                <div className="flex items-center bg-[#FFF9E6] dark:bg-[#3A351E]">
                  <div className="w-[200px] flex-shrink-0 p-2 font-semibold border-b border-[#DEE2E6] dark:border-[#333] sticky left-0 bg-[#FFF9E6] dark:bg-[#3A351E] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                    ✅ 任務列
                  </div>
                  <div className="flex-1 border-b border-[#DEE2E6] dark:border-[#333]"></div>
                </div>
                {tasks.map((task, idx) => {
                  const taskTime = task.time || '12:00';
                  const taskPos = timeToPosition(taskTime);
                  return (
                    <div key={idx} className="flex items-center border-b border-[#DEE2E6] dark:border-[#333]">
                      <div className="w-[200px] flex-shrink-0 p-2 text-sm border-r border-[#DEE2E6] dark:border-[#333] sticky left-0 bg-white dark:bg-[#1E1E1E] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                        {task.name}
                      </div>
                      <div className="relative flex-1" style={{ height: '40px' }}>
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 cursor-pointer ${
                            task.team === '外場' ? 'bg-[#27AE60]' : 'bg-[#F39C12]'
                          }`}
                          style={{ left: `${taskPos}px` }}
                          title={`${task.name}\n負責人：${task.assignee || '未指派'}\n時間：${taskTime}`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Current time line (global) */}
            {currentTimePos !== null && currentTimePos >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-30"
                style={{ left: `${currentTimePos + 200}px` }}
              >
                <div className="absolute top-0 -left-8 text-xs text-white font-semibold bg-red-500 px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                  NOW
                </div>
                <div className="absolute top-6 -left-8 text-xs text-red-500 font-medium bg-white dark:bg-[#1E1E1E] px-1 border border-red-500 rounded whitespace-nowrap">
                  {currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render event details section
  const renderEventDetails = (event: Event) => {
    const eventId = event.eventId;
    const schedules = getSchedulesByEvent(eventId);
    const menus = getMenusByEvent(eventId);
    const notes = getNotesByEvent(eventId);
    const preparationItems = getPreparationItemsByEvent(eventId);
    const frontStaff = getStaffByEvent(eventId, '外場');
    const backStaff = getStaffByEvent(eventId, '內場');
    const frontTasks = getTasksByEvent(eventId, '外場');
    const backTasks = getTasksByEvent(eventId, '內場');
    const tablePlacements = getTablePlacementsByEvent(eventId);
    const allStaff = getStaffByEvent(eventId);
    const budgets = getBudgetsByEvent(eventId);
    const remark = getRemarkByEvent(eventId);
    const tableImage = getTableLayoutImage(eventId);
    
    // For Gantt Chart
    const staffList = allStaff.map(s => ({
      name: s.name,
      team: s.team,
      position: s.dayPosition,
      arrival: s.arrival,
      departure: s.departure,
      area: s.note
    }));
    const taskList = [...frontTasks, ...backTasks];

    const calculateBudgetEstimated = () =>
      budgets.reduce((sum, item) => sum + (parseFloat(item.estimated) || 0), 0);
    const calculateBudgetActual = () =>
      budgets.reduce((sum, item) => sum + (parseFloat(item.actual) || 0), 0);

    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg p-8">
        {/* Event Header */}
        <h2 className="text-2xl mb-6 pb-4 border-b-2 border-[#DEE2E6] dark:border-[#333] text-[#2C3E50] dark:text-[#E0E0E0]">
          <EditableText
            value={`${event.icon} ${event.name} - ${event.date}`}
            onChange={(v) => {
              const parts = v.split(' - ');
              if (parts.length >= 2) {
                const nameWithIcon = parts[0];
                updateEvent(eventId, { name: nameWithIcon.replace(event.icon, '').trim(), date: parts[1] });
              }
            }}
          />
        </h2>

        {/* Basic Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {event.venue && (
            <div className="bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#666] dark:text-[#AAA] text-sm mb-1">
                <span>📍</span>
                <span>活動地點</span>
              </div>
              <div className="text-[#2C3E50] dark:text-[#E0E0E0] font-medium">
                <EditableText
                  value={event.venue}
                  onChange={(v) => updateEvent(eventId, { venue: v })}
                />
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#666] dark:text-[#AAA] text-sm mb-1">
              <span>🕐</span>
              <span>時段</span>
            </div>
            <div className="text-[#2C3E50] dark:text-[#E0E0E0] font-medium">
              <EditableText
                value={event.timeSlot}
                onChange={(v) => updateEvent(eventId, { timeSlot: v })}
              />
            </div>
          </div>
          <div className="bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#666] dark:text-[#AAA] text-sm mb-1">
              <span>👥</span>
              <span>規模</span>
            </div>
            <div className="text-[#2C3E50] dark:text-[#E0E0E0] font-medium">
              <EditableText
                value={event.scale}
                onChange={(v) => updateEvent(eventId, { scale: v })}
              />
            </div>
          </div>
          {event.price && (
            <div className="bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#666] dark:text-[#AAA] text-sm mb-1">
                <span>💰</span>
                <span>價格</span>
              </div>
              <div className="text-[#2C3E50] dark:text-[#E0E0E0] font-medium">
                <EditableText
                  value={event.price}
                  onChange={(v) => updateEvent(eventId, { price: v })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Couple & Planner Info */}
        {(event.couple || event.planner) && (
          <div className="mb-6 space-y-2 text-[#333] dark:text-[#E0E0E0]">
            {event.couple && (
              <div className="flex items-center gap-2">
                <span className="text-red-500">❤️</span>
                <span>新人：</span>
                <EditableText
                  value={event.couple}
                  onChange={(v) => updateEvent(eventId, { couple: v })}
                />
              </div>
            )}
            {event.planner && (
              <div className="flex items-center gap-2">
                <span className="text-[#3498DB]">📞</span>
                <span>婚顧：</span>
                <EditableText
                  value={event.planner}
                  onChange={(v) => updateEvent(eventId, { planner: v })}
                />
              </div>
            )}
          </div>
        )}

        {/* 1. 前一天準備清單 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">📋 前一天準備清單</h3>
            <button
              onClick={() => {
                updatePreparationItems(eventId, [...preparationItems, { 
                  eventId, 
                  item: '準備項目', 
                  assignee: '負責人', 
                  description: '數量/說明', 
                  completed: false 
                }]);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增項目
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3498DB] text-white">
                  <th className="border border-[#DEE2E6] p-2 w-12">完成</th>
                  <th className="border border-[#DEE2E6] p-2">準備項目</th>
                  <th className="border border-[#DEE2E6] p-2">負責人</th>
                  <th className="border border-[#DEE2E6] p-2">數量/說明</th>
                  <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                </tr>
              </thead>
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {preparationItems.map((item, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => {
                          const newItems = [...preparationItems];
                          newItems[i] = { ...newItems[i], completed: e.target.checked };
                          updatePreparationItems(eventId, newItems);
                        }}
                        className="w-5 h-5 cursor-pointer accent-[#27AE60]"
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={item.item}
                        onChange={(v) => {
                          const newItems = [...preparationItems];
                          newItems[i] = { ...newItems[i], item: v };
                          updatePreparationItems(eventId, newItems);
                        }}
                        className={item.completed ? 'line-through text-[#999]' : ''}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={item.assignee}
                        onChange={(v) => {
                          const newItems = [...preparationItems];
                          newItems[i] = { ...newItems[i], assignee: v };
                          updatePreparationItems(eventId, newItems);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={item.description}
                        onChange={(v) => {
                          const newItems = [...preparationItems];
                          newItems[i] = { ...newItems[i], description: v };
                          updatePreparationItems(eventId, newItems);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                      <button
                        onClick={() => {
                          updatePreparationItems(eventId, preparationItems.filter((_, idx) => idx !== i));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Menu Section */}
        {menus.length > 0 && (
          <div className="mt-8">
            <h3 className="section-title">🍱 菜單清單</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#3498DB] text-white">
                    <th className="border border-[#DEE2E6] p-3 w-20">照片</th>
                    <th className="border border-[#DEE2E6] p-3">品項名稱</th>
                    <th className="border border-[#DEE2E6] p-3 w-24">份數</th>
                    <th className="border border-[#DEE2E6] p-3 w-40">備註</th>
                    <th className="border border-[#DEE2E6] p-3 w-28">內場確認</th>
                    <th className="border border-[#DEE2E6] p-3 w-20 print:hidden">操作</th>
                  </tr>
                </thead>
                <tbody className="text-[#333] dark:text-[#E0E0E0]">
                  {menus.map((menuItem, i) => (
                    <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50]/30">
                      <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                        {/* Photo Upload/Display */}
                        <div className="relative print:hidden flex justify-center">
                          {menuItem.photoUrl ? (
                            <div className="relative group">
                              <img
                                src={menuItem.photoUrl}
                                alt={menuItem.item}
                                className="w-12 h-12 object-cover rounded border border-[#DEE2E6] dark:border-[#333]"
                              />
                              <button
                                onClick={() => clearMenuPhoto(eventId, i)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                title="清除照片"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <div className="w-12 h-12 flex items-center justify-center border-2 border-dashed border-[#DEE2E6] dark:border-[#333] rounded hover:border-[#3498DB] transition-colors">
                                <span className="text-xl">📷</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleMenuPhotoUpload(eventId, i, file);
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                        <EditableText
                          value={menuItem.item}
                          onChange={(v) => {
                            const newMenus = [...menus];
                            newMenus[i] = { ...newMenus[i], item: v };
                            updateMenus(eventId, newMenus);
                          }}
                        />
                      </td>
                      <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                        <EditableText
                          value={menuItem.quantity || ''}
                          onChange={(v) => {
                            const newMenus = [...menus];
                            newMenus[i] = { ...newMenus[i], quantity: v };
                            updateMenus(eventId, newMenus);
                          }}
                          placeholder="10份"
                        />
                      </td>
                      <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                        <EditableText
                          value={menuItem.note || ''}
                          onChange={(v) => {
                            const newMenus = [...menus];
                            newMenus[i] = { ...newMenus[i], note: v };
                            updateMenus(eventId, newMenus);
                          }}
                          placeholder="備註說明"
                        />
                      </td>
                      <td className="border border-[#DEE2E6] dark:border-[#333] p-3 text-center">
                        <button
                          onClick={() => {
                            const newMenus = [...menus];
                            newMenus[i] = { ...newMenus[i], kitchenConfirmed: !newMenus[i].kitchenConfirmed };
                            updateMenus(eventId, newMenus);
                          }}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            menuItem.kitchenConfirmed
                              ? 'bg-[#27AE60] text-white hover:bg-[#229954]'
                              : 'bg-[#F8F9FA] dark:bg-[#2C3E50] text-[#666] dark:text-[#AAA] hover:bg-[#E0E0E0] dark:hover:bg-[#3C4E60]'
                          }`}
                        >
                          {menuItem.kitchenConfirmed ? '✅ 已確認' : '未確認'}
                        </button>
                      </td>
                      <td className="border border-[#DEE2E6] dark:border-[#333] p-3 text-center print:hidden">
                        <button
                          onClick={() => {
                            updateMenus(eventId, menus.filter((_, idx) => idx !== i));
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => {
                  updateMenus(eventId, [...menus, { 
                    eventId, 
                    item: '新菜單項目', 
                    quantity: '', 
                    note: '', 
                    kitchenConfirmed: false 
                  }]);
                }}
                className="flex items-center gap-1 px-4 py-2 mt-3 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
              >
                <Plus className="w-4 h-4" />
                新增菜單
              </button>
            </div>
          </div>
        )}

        {/* Drinks */}
        {event.drinks && (
          <div className="mb-6 flex items-center gap-2 text-[#333] dark:text-[#E0E0E0]">
            <span>🍷 自備酒水：</span>
            <EditableText
              value={event.drinks}
              onChange={(v) => updateEvent(eventId, { drinks: v })}
            />
          </div>
        )}

        {/* Schedule Table */}
        <div className="mt-8">
          <h3 className="section-title">⏰ 時程表</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {schedules.map((item, i) => (
                  <tr key={i} className="hover:bg-[#FFF8DC] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-3 w-24">
                      <EditableText
                        value={item.time}
                        onChange={(v) => {
                          const newSchedules = [...schedules];
                          newSchedules[i] = { ...newSchedules[i], time: v };
                          updateSchedules(eventId, newSchedules);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                      <EditableText
                        value={item.content}
                        onChange={(v) => {
                          const newSchedules = [...schedules];
                          newSchedules[i] = { ...newSchedules[i], content: v };
                          updateSchedules(eventId, newSchedules);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden w-12">
                      <button
                        onClick={() => {
                          updateSchedules(eventId, schedules.filter((_, idx) => idx !== i));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => {
                updateSchedules(eventId, [...schedules, { eventId, time: '', content: '' }]);
              }}
              className="mt-2 flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增時程
            </button>
          </div>
        </div>

        {/* Special Notes */}
        {notes.length > 0 && (
          <div className="mt-8">
            <h3 className="section-title">⚠️ 特別注意</h3>
            <div className="bg-[#FFF3CD] dark:bg-[#8B7500] rounded-lg p-4 space-y-2 mb-6">
              {notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#F39C12]">•</span>
                  <EditableText
                    value={note.content}
                    onChange={(v) => {
                      const newNotes = [...notes];
                      newNotes[i] = { ...newNotes[i], content: v };
                      updateNotes(eventId, newNotes);
                    }}
                    className="flex-1"
                  />
                  <button
                    onClick={() => {
                      updateNotes(eventId, notes.filter((_, idx) => idx !== i));
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors print:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateNotes(eventId, [...notes, { eventId, content: '新增注意事項' }]);
                }}
                className="flex items-center gap-1 px-3 py-1 bg-[#F39C12] text-white rounded hover:bg-[#E67E22] transition-colors text-sm print:hidden"
              >
                <Plus className="w-4 h-4" />
                新增注意事項
              </button>
            </div>
          </div>
        )}

        {/* Front Staff */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-[#2C3E50] dark:text-[#E0E0E0]">👔 外場人員</h3>
            <button
              onClick={() => {
                updateStaffMembers(eventId, [...data.staffMembers.filter(s => s.eventId === eventId), {
                  eventId,
                  name: '員工姓名',
                  dayPosition: '外場服務員',
                  team: '外場',
                  arrival: '',
                  departure: '',
                  note: '',
                  attendance: '未確認'
                }]);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增外場人員
            </button>
          </div>
          <div className="overflow-x-auto mb-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3498DB] text-white">
                  <th className="border border-[#DEE2E6] p-2">姓名</th>
                  <th className="border border-[#DEE2E6] p-2">當天崗位</th>
                  <th className="border border-[#DEE2E6] p-2">到場時間</th>
                  <th className="border border-[#DEE2E6] p-2">離場時間</th>
                  <th className="border border-[#DEE2E6] p-2">出勤</th>
                  <th className="border border-[#DEE2E6] p-2">備註</th>
                  <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                </tr>
              </thead>
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {frontStaff.map((staff, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.name}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], name: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.dayPosition}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], dayPosition: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.arrival}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], arrival: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.departure}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], departure: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center">
                      <button
                        onClick={() => toggleAttendance(eventId, staff)}
                        className={`px-3 py-1 rounded transition-colors min-w-[50px] ${
                          (staff.attendance || '未確認') === '未確認' ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300' :
                          staff.attendance === 'O' ? 'bg-green-500 text-white' :
                          'bg-red-500 text-white'
                        }`}
                        title="點擊切換出勤狀態"
                      >
                        {(staff.attendance || '未確認') === '未確認' ? '－' : staff.attendance}
                      </button>
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.note}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], note: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                      <button
                        onClick={() => {
                          updateStaffMembers(eventId, data.staffMembers.filter(s => s.eventId === eventId && s !== staff));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* Back Staff */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-[#2C3E50] dark:text-[#E0E0E0]">👨‍🍳 內場人員</h3>
            <button
              onClick={() => {
                updateStaffMembers(eventId, [...data.staffMembers.filter(s => s.eventId === eventId), {
                  eventId,
                  name: '員工姓名',
                  dayPosition: '內場主廚',
                  team: '內場',
                  arrival: '',
                  departure: '',
                  note: '',
                  attendance: '未確認'
                }]);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增內場人員
            </button>
          </div>
          <div className="overflow-x-auto mb-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3498DB] text-white">
                  <th className="border border-[#DEE2E6] p-2">姓名</th>
                  <th className="border border-[#DEE2E6] p-2">當天崗位</th>
                  <th className="border border-[#DEE2E6] p-2">到場時間</th>
                  <th className="border border-[#DEE2E6] p-2">離場時間</th>
                  <th className="border border-[#DEE2E6] p-2">出勤</th>
                  <th className="border border-[#DEE2E6] p-2">備註</th>
                  <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                </tr>
              </thead>
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {backStaff.map((staff, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.name}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], name: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.dayPosition}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], dayPosition: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.arrival}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], arrival: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.departure}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], departure: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center">
                      <button
                        onClick={() => toggleAttendance(eventId, staff)}
                        className={`px-3 py-1 rounded transition-colors min-w-[50px] ${
                          (staff.attendance || '未確認') === '未確認' ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300' :
                          staff.attendance === 'O' ? 'bg-green-500 text-white' :
                          'bg-red-500 text-white'
                        }`}
                        title="點擊切換出勤狀態"
                      >
                        {(staff.attendance || '未確認') === '未確認' ? '－' : staff.attendance}
                      </button>
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={staff.note}
                        onChange={(v) => {
                          const allStaffMembers = data.staffMembers.filter(s => s.eventId === eventId);
                          const idx = allStaffMembers.findIndex(s => s === staff);
                          if (idx !== -1) {
                            allStaffMembers[idx] = { ...allStaffMembers[idx], note: v };
                            updateStaffMembers(eventId, allStaffMembers);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                      <button
                        onClick={() => {
                          updateStaffMembers(eventId, data.staffMembers.filter(s => s.eventId === eventId && s !== staff));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Quick Add Staff Row for Back Staff */}
          <div className="mt-4 p-4 border-2 border-dashed border-[#3498DB] bg-[#EBF5FB] dark:bg-[#1A3A52] rounded-lg print:hidden">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickAddMode('library')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    quickAddMode === 'library' 
                      ? 'bg-[#3498DB] text-white' 
                      : 'bg-white dark:bg-[#2C3E50] text-[#666] dark:text-[#AAA]'
                  }`}
                >
                  從人員庫選
                </button>
                <button
                  onClick={() => setQuickAddMode('manual')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    quickAddMode === 'manual' 
                      ? 'bg-[#3498DB] text-white' 
                      : 'bg-white dark:bg-[#2C3E50] text-[#666] dark:text-[#AAA]'
                  }`}
                >
                  手動輸入
                </button>
              </div>

              {/* Name Input */}
              {quickAddMode === 'library' ? (
                <>
                  <select
                    value={quickAddName}
                    onChange={(e) => { handleStaffLibrarySelect(e.target.value, eventId); setDuplicateStaffError(false); }}
                    className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
                  >
                    <option value="">選擇人員...</option>
                    {getStaffLibrary(eventId).length === 0 && (
                      <option disabled>無可用人員（請先在人員庫設為О）</option>
                    )}
                    {getStaffLibrary(eventId).map((staff, i) => (
                      <option key={i} value={staff.name}>
                        {staff.name} ({staff.team})
                      </option>
                    ))}
                  </select>
                  {getStaffLibrary(eventId).length === 0 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ 請先在人員庫中將員工設為「О」
                    </span>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  placeholder="姓名"
                  value={quickAddName}
                  onChange={(e) => { setQuickAddName(e.target.value); setDuplicateStaffError(false); }}
                  className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0] w-32"
                />
              )}

              {/* Day Position */}
              <div className="flex flex-col gap-1">
                <select
                  value={quickAddPosition}
                  onChange={(e) => {
                    setQuickAddPosition(e.target.value);
                    if (e.target.value) setPositionError(false);
                  }}
                  className={`px-3 py-2 border rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0] ${
                    positionError ? 'border-red-500' : 'border-[#DEE2E6] dark:border-[#333]'
                  }`}
                >
                  <option value="">請選擇崗位</option>
                  {positionOptions.map((pos, i) => (
                    <option key={i} value={pos}>{pos}</option>
                  ))}
                </select>
                {positionError && (
                  <span className="text-xs text-red-500">請選擇崗位</span>
                )}
              </div>

              {/* Team */}
              <select
                value={quickAddTeam}
                onChange={(e) => setQuickAddTeam(e.target.value as '外場' | '內場' | '其他')}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
              >
                <option value="外場">外場</option>
                <option value="內場">內場</option>
                <option value="其他">其他</option>
              </select>

              {/* Arrival Time */}
              <select
                value={quickAddArrival}
                onChange={(e) => setQuickAddArrival(e.target.value)}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
              >
                {timeOptions.map((time, i) => (
                  <option key={i} value={time}>{time}</option>
                ))}
              </select>

              <span className="text-[#666] dark:text-[#AAA]">→</span>

              {/* Departure Time */}
              <select
                value={quickAddDeparture}
                onChange={(e) => setQuickAddDeparture(e.target.value)}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
              >
                {timeOptions.map((time, i) => (
                  <option key={i} value={time}>{time}</option>
                ))}
              </select>

              {/* Area */}
              <input
                type="text"
                placeholder="負責區域"
                value={quickAddArea}
                onChange={(e) => setQuickAddArea(e.target.value)}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0] flex-1 min-w-[120px]"
              />

              {/* Add Button + Duplicate Warning */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleQuickAddStaff(eventId)}
                  disabled={!quickAddName.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                    quickAddName.trim()
                      ? 'bg-[#27AE60] text-white hover:bg-[#229954] cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>加入</span>
                </button>
                {duplicateStaffError && (
                  <span className="text-xs text-orange-500">⚠️ 此人員已在名單中</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-[#666] dark:text-[#AAA]">
            內場人數：<span className="font-semibold text-[#2C3E50] dark:text-[#E0E0E0]">{backStaff.length}</span> 人
          </div>
        </div>

        {/* Personal Schedule */}
        <div className="mt-8">
          <h3 className="section-title">📅 人員當日時間表</h3>
          <div className="space-y-4">
            {allStaff.map((staff, staffIdx) => {
              const personalSchedules = getPersonalSchedulesByEvent(eventId, staff.name);
              const isExpanded = expandedStaff[`${eventId}-${staff.name}`] !== false;
              
              return (
                <div key={staffIdx} className="border border-[#DEE2E6] dark:border-[#333] rounded-lg overflow-hidden">
                  <div
                    onClick={() => setExpandedStaff(prev => ({ ...prev, [`${eventId}-${staff.name}`]: !isExpanded }))}
                    className="bg-[#E9ECEF] dark:bg-[#2C3E50] p-3 flex items-center justify-between cursor-pointer hover:bg-[#DEE2E6] dark:hover:bg-[#3A4E60] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#2C3E50] dark:text-[#E0E0E0]">{staff.name}</span>
                      <span className="text-sm px-2 py-1 rounded bg-white dark:bg-[#1E1E1E] text-[#666] dark:text-[#AAA]">
                        {staff.dayPosition} · {staff.team}
                      </span>
                    </div>
<div className="flex items-center gap-2 print:hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImportTasksToPersonalSchedule(eventId, staff.name);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs transition-colors"
                        title="從任務清單中帶入此員工被指派的任務"
                      >
                        📋 從任務帶入
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const printWindow = window.open('', '_blank');
                          if (!printWindow) return;
                          const schedules = getPersonalSchedulesByEvent(eventId, staff.name);
                          const eventInfo = data.events.find(ev => ev.eventId === eventId);
                          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${staff.name} 個人行程</title><style>body{font-family:'Noto Sans TC',sans-serif;padding:20px;color:#333}h1{font-size:18px;border-bottom:2px solid #3498DB;padding-bottom:8px;color:#2C3E50}h2{font-size:14px;color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#3498DB;color:white;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #dee2e6}tr:nth-child(even){background:#f8f9fa}.footer{margin-top:24px;font-size:12px;color:#999}</style></head><body><h1>📋 ${staff.name} - 個人當日行程</h1><h2>${eventInfo ? eventInfo.name + ' (' + eventInfo.date + ')' : ''} ｜ ${staff.dayPosition} · ${staff.team}</h2><table><thead><tr><th style="width:120px">時間</th><th>任務描述</th></tr></thead><tbody>${schedules.sort((a,b)=>a.time.localeCompare(b.time)).map(s=>'<tr><td>'+s.time+'</td><td>'+s.task+'</td></tr>').join('')}${schedules.length===0?'<tr><td colspan="2" style="text-align:center;color:#999">尚無行程項目</td></tr>':''}</tbody></table><div class="footer">列印時間：${new Date().toLocaleString('zh-TW')}</div></body></html>`;
                          printWindow.document.write(html);
                          printWindow.document.close();
                          printWindow.print();
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-[#3498DB] hover:bg-[#2C7CB8] text-white rounded text-xs transition-colors"
                        title="單獨列印此人員行程"
                      >
                        🖨️ 列印
                      </button>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    <div className="hidden print:flex">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4">
                      <table className="w-full border-collapse mb-2">
                        <thead>
                          <tr className="bg-[#F8F9FA] dark:bg-[#1E1E1E]">
                            <th className="border border-[#DEE2E6] dark:border-[#333] p-2 text-left w-32">時間</th>
                            <th className="border border-[#DEE2E6] dark:border-[#333] p-2 text-left">任務描述</th>
                            <th className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden w-16">操作</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#333] dark:text-[#E0E0E0]">
                          {personalSchedules.map((schedule, i) => (
                            <tr key={i}>
                              <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                                <EditableText
                                  value={schedule.time}
                                  onChange={(v) => {
                                    const allSchedules = getPersonalSchedulesByEvent(eventId, staff.name);
                                    allSchedules[i] = { ...allSchedules[i], time: v };
                                    updatePersonalSchedules(eventId, [
                                      ...data.personalSchedules.filter(p => p.eventId !== eventId || p.staffName !== staff.name),
                                      ...allSchedules
                                    ]);
                                  }}
                                />
                              </td>
                              <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                                <EditableText
                                  value={schedule.task}
                                  onChange={(v) => {
                                    const allSchedules = getPersonalSchedulesByEvent(eventId, staff.name);
                                    allSchedules[i] = { ...allSchedules[i], task: v };
                                    updatePersonalSchedules(eventId, [
                                      ...data.personalSchedules.filter(p => p.eventId !== eventId || p.staffName !== staff.name),
                                      ...allSchedules
                                    ]);
                                  }}
                                />
                              </td>
                              <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                                <button
                                  onClick={() => {
                                    updatePersonalSchedules(eventId, 
                                      data.personalSchedules.filter(p => 
                                        !(p.eventId === eventId && p.staffName === staff.name && p === schedule)
                                      )
                                    );
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button
                        onClick={() => {
                          updatePersonalSchedules(eventId, [
                            ...data.personalSchedules,
                            { eventId, staffName: staff.name, time: '', task: '' }
                          ]);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
                      >
                        <Plus className="w-4 h-4" />
                        新增時間點
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Front Tasks */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-[#2C3E50] dark:text-[#E0E0E0]">✅ 外場任務清單</h3>
            <button
              onClick={() => {
                updateTasks(eventId, [...data.tasks.filter(t => t.eventId === eventId), {
                  eventId,
                  name: '任務名稱',
                  assignee: '負責人',
                  time: '',
                  team: '外場',
                  completed: false
                }]);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增外場任務
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3498DB] text-white">
                  <th className="border border-[#DEE2E6] p-2 w-12">完成</th>
                  <th className="border border-[#DEE2E6] p-2">任務名稱</th>
                  <th className="border border-[#DEE2E6] p-2">負責人</th>
                  <th className="border border-[#DEE2E6] p-2">時間點</th>
                  <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                </tr>
              </thead>
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {frontTasks.map((task, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], completed: e.target.checked };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                        className="w-5 h-5 cursor-pointer accent-[#27AE60]"
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={task.name}
                        onChange={(v) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], name: v };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                        className={task.completed ? 'line-through text-[#999]' : ''}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={task.assignee}
                        onChange={(v) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], assignee: v };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={task.time}
                        onChange={(v) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], time: v };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                      <button
                        onClick={() => {
                          updateTasks(eventId, data.tasks.filter(t => t.eventId === eventId && t !== task));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Quick Add Task */}
          <div className="mt-4 p-4 border-2 border-dashed border-[#3498DB] bg-[#EBF5FB] dark:bg-[#1A3A52] rounded-lg print:hidden">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="任務名稱"
                value={quickAddTaskName}
                onChange={(e) => setQuickAddTaskName(e.target.value)}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0] flex-1 min-w-[150px]"
              />
              <input
                type="text"
                placeholder="負責人"
                value={quickAddTaskAssignee}
                onChange={(e) => setQuickAddTaskAssignee(e.target.value)}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0] w-32"
              />
              <input
                type="text"
                placeholder="時間點"
                value={quickAddTaskTime}
                onChange={(e) => setQuickAddTaskTime(e.target.value)}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0] w-32"
              />
              <select
                value={quickAddTaskTeam}
                onChange={(e) => setQuickAddTaskTeam(e.target.value as '外場' | '內場' | '其他')}
                className="px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
              >
                <option value="外場">外場</option>
                <option value="內場">內場</option>
                <option value="其他">其他</option>
              </select>
              <button
                onClick={() => {
                  handleQuickAddTask(eventId);
                }}
                disabled={!quickAddTaskName.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  quickAddTaskName.trim()
                    ? 'bg-[#27AE60] text-white hover:bg-[#229954] cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>新增任務</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back Tasks */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-[#2C3E50] dark:text-[#E0E0E0]">✅ 內場任務清單</h3>
            <button
              onClick={() => {
                updateTasks(eventId, [...data.tasks.filter(t => t.eventId === eventId), {
                  eventId,
                  name: '任務名稱',
                  assignee: '負責人',
                  time: '',
                  team: '內場',
                  completed: false
                }]);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增內場任務
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3498DB] text-white">
                  <th className="border border-[#DEE2E6] p-2 w-12">完成</th>
                  <th className="border border-[#DEE2E6] p-2">任務名稱</th>
                  <th className="border border-[#DEE2E6] p-2">負責人</th>
                  <th className="border border-[#DEE2E6] p-2">時間點</th>
                  <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                </tr>
              </thead>
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {backTasks.map((task, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], completed: e.target.checked };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                        className="w-5 h-5 cursor-pointer accent-[#27AE60]"
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={task.name}
                        onChange={(v) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], name: v };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                        className={task.completed ? 'line-through text-[#999]' : ''}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={task.assignee}
                        onChange={(v) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], assignee: v };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={task.time}
                        onChange={(v) => {
                          const allTasks = data.tasks.filter(t => t.eventId === eventId);
                          const idx = allTasks.findIndex(t => t === task);
                          if (idx !== -1) {
                            allTasks[idx] = { ...allTasks[idx], time: v };
                            updateTasks(eventId, allTasks);
                          }
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                      <button
                        onClick={() => {
                          updateTasks(eventId, data.tasks.filter(t => t.eventId === eventId && t !== task));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Layout Image Upload */}
        <div className="mt-8">
          <h3 className="section-title">🗺️ 桌位配置</h3>
          <div className="border-2 border-dashed border-[#DEE2E6] dark:border-[#333] rounded-lg p-6">
            {tableImage?.imageBase64 ? (
              <div className="space-y-4">
                <img 
                  src={tableImage.imageBase64} 
                  alt="桌位配置圖" 
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                />
                <div className="flex justify-center gap-2 print:hidden">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors cursor-pointer">
                    <ImageIcon className="w-5 h-5" />
                    <span>更換圖片</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(eventId, file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (confirm('確定要刪除此圖片嗎？')) {
                        setTableLayoutImages(prev => prev.filter(img => img.eventId !== eventId));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    <span>刪除圖片</span>
                  </button>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2 text-[#2C3E50] dark:text-[#E0E0E0]">桌位說明備註：</label>
                  <EditableText
                    value={tableImage.note}
                    onChange={(v) => {
                      updateTableLayoutImage(eventId, tableImage.imageBase64, v);
                    }}
                    multiline
                    placeholder="點擊此處新增桌位說明..."
                    className="w-full min-h-[80px] text-[#333] dark:text-[#E0E0E0] block p-3 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#1E1E1E] whitespace-pre-wrap"
                  />
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors rounded print:hidden">
                <ImageIcon className="w-16 h-16 text-[#DEE2E6] dark:text-[#666] mb-4" />
                <span className="text-[#666] dark:text-[#AAA] mb-2">點擊上傳桌位配置圖</span>
                <span className="text-sm text-[#999] dark:text-[#777]">支援 JPG、PNG 格式</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(eventId, file);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Table Placement */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-[#2C3E50] dark:text-[#E0E0E0]">🪑 圓桌 / IBM桌擺放說明</h3>
            <button
              onClick={() => {
                updateTablePlacements(eventId, [...tablePlacements, {
                  eventId,
                  tableNumber: '',
                  tableType: '圓桌',
                  location: '',
                  capacity: '10',
                  note: ''
                }]);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增桌位
            </button>
          </div>
          <div className="overflow-x-auto mb-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3498DB] text-white">
                  <th className="border border-[#DEE2E6] p-2">桌號</th>
                  <th className="border border-[#DEE2E6] p-2">桌型</th>
                  <th className="border border-[#DEE2E6] p-2">位置說明</th>
                  <th className="border border-[#DEE2E6] p-2">人數</th>
                  <th className="border border-[#DEE2E6] p-2">備註</th>
                  <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                </tr>
              </thead>
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {tablePlacements.map((table, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={table.tableNumber}
                        onChange={(v) => {
                          const newTables = [...tablePlacements];
                          newTables[i] = { ...newTables[i], tableNumber: v };
                          updateTablePlacements(eventId, newTables);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableSelect
                        value={table.tableType}
                        options={['圓桌', 'IBM桌', '長桌', '吧台']}
                        onChange={(v) => {
                          const newTables = [...tablePlacements];
                          newTables[i] = { ...newTables[i], tableType: v as any };
                          updateTablePlacements(eventId, newTables);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={table.location}
                        onChange={(v) => {
                          const newTables = [...tablePlacements];
                          newTables[i] = { ...newTables[i], location: v };
                          updateTablePlacements(eventId, newTables);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center">
                      <EditableText
                        value={table.capacity}
                        onChange={(v) => {
                          const newTables = [...tablePlacements];
                          newTables[i] = { ...newTables[i], capacity: v };
                          updateTablePlacements(eventId, newTables);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={table.note}
                        onChange={(v) => {
                          const newTables = [...tablePlacements];
                          newTables[i] = { ...newTables[i], note: v };
                          updateTablePlacements(eventId, newTables);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                      <button
                        onClick={() => {
                          updateTablePlacements(eventId, tablePlacements.filter((_, idx) => idx !== i));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-[#666] dark:text-[#AAA] space-y-1">
            <div>
              圓桌：<span className="font-semibold text-[#2C3E50] dark:text-[#E0E0E0]">
                {tablePlacements.filter(t => t.tableType === '圓桌').length}
              </span> 張 ｜ 
              IBM桌：<span className="font-semibold text-[#2C3E50] dark:text-[#E0E0E0]">
                {tablePlacements.filter(t => t.tableType === 'IBM桌').length}
              </span> 張 ｜ 
              長桌：<span className="font-semibold text-[#2C3E50] dark:text-[#E0E0E0]">
                {tablePlacements.filter(t => t.tableType === '長桌').length}
              </span> 張 ｜ 
              吧台：<span className="font-semibold text-[#2C3E50] dark:text-[#E0E0E0]">
                {tablePlacements.filter(t => t.tableType === '吧台').length}
              </span> 個
            </div>
          </div>
        </div>

        {/* Budget Details */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-[#2C3E50] dark:text-[#E0E0E0]">💰 預算明細</h3>
            <button
              onClick={() => {
                updateBudgets(eventId, [...budgets, { eventId, name: '項目名稱', estimated: '0', actual: '0', note: '' }]);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors text-sm print:hidden"
            >
              <Plus className="w-4 h-4" />
              新增項目
            </button>
          </div>
          <div className="overflow-x-auto mb-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#3498DB] text-white">
                  <th className="border border-[#DEE2E6] p-2">項目名稱</th>
                  <th className="border border-[#DEE2E6] p-2">預估金額</th>
                  <th className="border border-[#DEE2E6] p-2">實際金額</th>
                  <th className="border border-[#DEE2E6] p-2">備註</th>
                  <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                </tr>
              </thead>
              <tbody className="text-[#333] dark:text-[#E0E0E0]">
                {budgets.map((item, i) => (
                  <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={item.name}
                        onChange={(v) => {
                          const newBudgets = [...budgets];
                          newBudgets[i] = { ...newBudgets[i], name: v };
                          updateBudgets(eventId, newBudgets);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-right">
                      <EditableText
                        value={item.estimated}
                        onChange={(v) => {
                          const newBudgets = [...budgets];
                          newBudgets[i] = { ...newBudgets[i], estimated: v };
                          updateBudgets(eventId, newBudgets);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-right">
                      <EditableText
                        value={item.actual}
                        onChange={(v) => {
                          const newBudgets = [...budgets];
                          newBudgets[i] = { ...newBudgets[i], actual: v };
                          updateBudgets(eventId, newBudgets);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                      <EditableText
                        value={item.note}
                        onChange={(v) => {
                          const newBudgets = [...budgets];
                          newBudgets[i] = { ...newBudgets[i], note: v };
                          updateBudgets(eventId, newBudgets);
                        }}
                      />
                    </td>
                    <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                      <button
                        onClick={() => {
                          updateBudgets(eventId, budgets.filter((_, idx) => idx !== i));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold border-t-2 border-[#3498DB] bg-[#f0f8f0] dark:bg-[#1A3A2A]">
                  <td className="border border-[#DEE2E6] dark:border-[#333] p-2">總計</td>
                  <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-right">
                    NT$ {calculateBudgetEstimated().toLocaleString()}
                  </td>
                  <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-right">
                    NT$ {calculateBudgetActual().toLocaleString()}
                  </td>
                  <td className="border border-[#DEE2E6] dark:border-[#333] p-2" colSpan={2}>
                    差異：
                    {(() => {
                      const diff = calculateBudgetActual() - calculateBudgetEstimated();
                      if (diff > 0) return <span className="text-red-500"> ▲ NT$ {diff.toLocaleString()} 超支</span>;
                      if (diff < 0) return <span className="text-green-600"> ▼ NT$ {Math.abs(diff).toLocaleString()} 結餘</span>;
                      return <span className="text-gray-400"> NT$ 0 持平</span>;
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks */}
        <div className="mt-8">
          <h3 className="section-title">📝 備註 / 特殊需求</h3>
          <EditableText
            value={remark}
            onChange={(v) => updateRemark(eventId, v)}
            multiline
            placeholder="點擊此處新增備註或特殊需求..."
            className="w-full min-h-[120px] text-[#333] dark:text-[#E0E0E0] block p-3 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#1E1E1E] whitespace-pre-wrap"
          />
        </div>

        {/* Gantt Chart */}
        <GanttChart
          event={event}
          staff={staffList}
          schedules={schedules}
          tasks={taskList}
        />
      </div>
    );
  };

  return (
    <div 
      className={`min-h-screen bg-[#f5f6fa] dark:bg-[#121212] transition-colors ${
        darkMode ? 'dark' : ''
      }`}
      style={{ fontSize: `${fontSize}rem`, fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      {/* Toolbar */}
      {!isPrintMode && (
        <div className="bg-[#2C3E50] text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded transition-colors h-10"
            >
              <Save className="w-5 h-5" />
              <span>儲存</span>
            </button>
            
            {/* Real-time Sync Button */}
            <button
              onClick={handleRealTimeSync}
              disabled={isRealTimeSyncing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded transition-colors h-10 ${
                realTimeSyncStatus === 'success' ? 'bg-green-500 text-white' :
                realTimeSyncStatus === 'error' ? 'bg-red-500 text-white' :
                realTimeSyncStatus === 'syncing' ? 'bg-blue-400 text-white' :
                'bg-[#3498DB] hover:bg-[#2C7CB8] text-white'
              } ${isRealTimeSyncing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {realTimeSyncStatus === 'syncing' && <RefreshCw className="w-5 h-5 animate-spin" />}
              {realTimeSyncStatus === 'success' && <Check className="w-5 h-5" />}
              {realTimeSyncStatus === 'error' && <X className="w-5 h-5" />}
              {realTimeSyncStatus === 'idle' && <span>☁️</span>}
              <span>
                {realTimeSyncStatus === 'syncing' ? '同步中…' :
                 realTimeSyncStatus === 'success' ? '已同步' :
                 realTimeSyncStatus === 'error' ? '失敗' :
                 '同步'}
              </span>
            </button>
            {realTimeSyncError && (
              <span className="text-xs text-orange-400">{realTimeSyncError}</span>
            )}
            
            {/* Auto-sync indicator */}
            {autoSync && gasUrl && (
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded transition-colors text-xs cursor-pointer border border-green-500/30"
                title="點擊跳轉至設定頁"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-green-300">自動同步中</span>
              </button>
            )}
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded transition-colors h-10"
            >
              <Printer className="w-5 h-5" />
              <span>列印</span>
            </button>
            <div className="w-px h-8 bg-white/20"></div>
            <button
              onClick={decreaseFontSize}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded transition-colors h-10"
            >
              A-
            </button>
            <button
              onClick={increaseFontSize}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded transition-colors h-10"
            >
              A+
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded transition-colors h-10"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <div className={`flex items-center gap-2 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
            <Check className="w-5 h-5 text-[#27AE60]" />
            <span className="text-[#27AE60]">已儲存</span>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        {!isPrintMode && (
          <TabsList className="bg-white dark:bg-[#1E1E1E] border-b border-[#DEE2E6] dark:border-[#333] px-6 py-0 flex items-center gap-1 overflow-x-auto print:hidden">
            <TabsTrigger
              value="overview"
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#3498DB] data-[state=active]:text-[#3498DB] transition-all"
            >
              📅 總覽
            </TabsTrigger>
            {(data.events || []).map((event) => (
              <TabsTrigger
                key={event.eventId}
                value={event.eventId}
                className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#3498DB] data-[state=active]:text-[#3498DB] transition-all"
              >
                {event.icon} {event.name}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="staff"
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#3498DB] data-[state=active]:text-[#3498DB] transition-all"
            >
              👥 全員
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#3498DB] data-[state=active]:text-[#3498DB] transition-all"
            >
              ⚙️ 設定
            </TabsTrigger>
          </TabsList>
        )}

        {/* Tab Content */}
        <div className="max-w-[1200px] mx-auto p-6">
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg p-8">
              <h2 className="text-2xl mb-6 pb-4 border-b-2 border-[#DEE2E6] dark:border-[#333] text-[#2C3E50] dark:text-[#E0E0E0]">
                三月包場排程總覽
              </h2>

              {/* Event Date Manager */}
              <div className="mb-8">
                <h3 className="section-title">📅 場次管理</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#3498DB] text-white">
                        <th className="border border-[#DEE2E6] p-2">日期</th>
                        <th className="border border-[#DEE2E6] p-2">時段</th>
                        <th className="border border-[#DEE2E6] p-2">活動名稱</th>
                        <th className="border border-[#DEE2E6] p-2">狀態</th>
                        <th className="border border-[#DEE2E6] p-2 print:hidden">操作</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#333] dark:text-[#E0E0E0]">
                      {(data.events || []).map((event) => (
                        <tr key={event.eventId} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                          <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                            <input
                              type="date"
                              value={event.date}
                              onChange={(e) => updateEvent(event.eventId, { date: e.target.value })}
                              className="w-full px-2 py-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#3498DB] rounded"
                            />
                          </td>
                          <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                            <EditableText
                              value={event.timeSlot}
                              onChange={(v) => updateEvent(event.eventId, { timeSlot: v })}
                            />
                          </td>
                          <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                            <EditableText
                              value={event.name}
                              onChange={(v) => updateEvent(event.eventId, { name: v })}
                            />
                          </td>
                          <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                            <select
                              value={event.status}
                              onChange={(e) => updateEvent(event.eventId, { status: e.target.value })}
                              className="w-full px-2 py-1 bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded"
                            >
                              <option value="規劃中">規劃中</option>
                              <option value="確認">確認</option>
                              <option value="進行中">進行中</option>
                              <option value="完成">完成</option>
                              <option value="取消">取消</option>
                            </select>
                          </td>
                          <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center print:hidden">
                            <button
                              onClick={() => removeEvent(event.eventId)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="刪除場次"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Add New Event Row */}
                      <tr className="bg-[#EBF5FB] dark:bg-[#1A3A52] print:hidden">
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                          <input
                            type="date"
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded"
                          />
                        </td>
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                          <input
                            type="text"
                            placeholder="18:00~22:00"
                            value={newEventTimeSlot}
                            onChange={(e) => setNewEventTimeSlot(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded"
                          />
                        </td>
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                          <input
                            type="text"
                            placeholder="活動名稱"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded"
                          />
                        </td>
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-2">
                          <select
                            value={newEventStatus}
                            onChange={(e) => setNewEventStatus(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded"
                          >
                            <option value="規劃中">規劃中</option>
                            <option value="確認">確認</option>
                            <option value="進行中">進行中</option>
                            <option value="完成">完成</option>
                            <option value="取消">取消</option>
                          </select>
                        </td>
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-2 text-center">
                          <button
                            onClick={addEvent}
                            disabled={!newEventDate || !newEventName}
                            className={`px-3 py-1 rounded transition-colors ${
                              newEventDate && newEventName
                                ? 'bg-[#27AE60] text-white hover:bg-[#229954] cursor-pointer'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            ＋ 新增場次
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {(data.events || []).map((event) => (
                  <div
                    key={event.eventId}
                    className="border-2 border-[#3498DB] rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setActiveTab(event.eventId)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-[#2C3E50] dark:text-[#E0E0E0]">
                        {event.icon} {event.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.status === '進行中' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                        event.status === '已完成' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-[#666] dark:text-[#AAA]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <span>{event.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>{event.scale}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preparation Items */}
              <h3 className="section-title">
                <EditableText
                  value={data.preparationTitle}
                  onChange={(v) => setData(prev => ({ ...prev, preparationTitle: v }))}
                />
              </h3>
              <div className="bg-[#FFF3CD] dark:bg-[#8B7500] rounded-lg p-4 space-y-2">
                {data.preparationItemsGlobal.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#F39C12]">•</span>
                    <EditableText
                      value={item}
                      onChange={(v) => {
                        const newItems = [...data.preparationItemsGlobal];
                        newItems[i] = v;
                        setData(prev => ({ ...prev, preparationItemsGlobal: newItems }));
                      }}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Dynamic Event Tabs */}
          {(data.events || []).map((event) => (
            <TabsContent key={event.eventId} value={event.eventId}>
              {renderEventDetails(event)}
            </TabsContent>
          ))}

          {/* Staff Tab */}
          <TabsContent value="staff">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg p-8">
              <h2 className="text-2xl mb-6 pb-4 border-b-2 border-[#DEE2E6] dark:border-[#333] text-[#2C3E50] dark:text-[#E0E0E0]">
                員工班表管理
              </h2>

              {/* Staff Table */}
              <h3 className="section-title">人員庫</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#3498DB] text-white">
                      <th className="border border-[#DEE2E6] p-3">照片</th>
                      <th className="border border-[#DEE2E6] p-3">姓名</th>
                      <th className="border border-[#DEE2E6] p-3">組別</th>
                      <th className="border border-[#DEE2E6] p-3">備註</th>
                      {(data.events || []).map((event) => (
                        <th key={event.eventId} className="border border-[#DEE2E6] p-3">
                          <div className="flex flex-col gap-2">
                            <div>{event.name}</div>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  // Batch set all staff to "O" status for this event
                                  const newStaff = (data.globalStaff || []).map(person => ({
                                    ...person,
                                    eventAssignments: {
                                      ...person.eventAssignments,
                                      [event.eventId]: {
                                        status: 'O' as const,
                                        arrival: person.eventAssignments[event.eventId]?.arrival || '09:00',
                                        departure: person.eventAssignments[event.eventId]?.departure || '17:00'
                                      }
                                    }
                                  }));
                                  setData(prev => ({ ...prev, globalStaff: newStaff }));
                                }}
                                className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors print:hidden"
                                title="將所有員工設為出勤"
                              >
                                全選 О
                              </button>
                              <div className="relative copy-time-dropdown-container">
                                <button
                                  onClick={() => setShowCopyTimeDropdown(showCopyTimeDropdown === event.eventId ? null : event.eventId)}
                                  className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors print:hidden"
                                  title="複製此場次的時間到其他場次"
                                >
                                  📋 複製時間
                                </button>
                                {showCopyTimeDropdown === event.eventId && (
                                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2C3E50] border border-[#DEE2E6] dark:border-[#333] rounded shadow-lg z-10 min-w-[150px]">
                                    {data.events
                                      .filter(e => e.eventId !== event.eventId)
                                      .map(targetEvent => (
                                        <button
                                          key={targetEvent.eventId}
                                          onClick={() => handleCopyEventTimes(event.eventId, targetEvent.eventId)}
                                          className="w-full text-left px-3 py-2 text-xs text-[#333] dark:text-[#E0E0E0] hover:bg-[#F8F9FA] dark:hover:bg-[#1E1E1E] transition-colors"
                                        >
                                          複製到 {targetEvent.name}
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="border border-[#DEE2E6] border-dashed p-3 bg-gray-100 dark:bg-gray-800">
                        <button
                          onClick={() => setShowAddEventDialog(true)}
                          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#3498DB] dark:hover:text-[#3498DB] transition-colors print:hidden flex items-center gap-1 mx-auto"
                          title="新增場次欄位"
                        >
                          <Plus className="w-4 h-4" />
                          新增場次
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[#333] dark:text-[#E0E0E0]">
                    {(data.globalStaff || []).map((person, i) => (
                      <tr key={i} className="hover:bg-[#F8F9FA] dark:hover:bg-[#2C3E50] transition-colors">
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-3 text-center">
                          {person.photoUrl ? (
                            <div className="relative group inline-block">
                              <img
                                src={person.photoUrl}
                                alt={person.name}
                                className="w-[44px] h-[44px] object-cover rounded-full border-2 border-[#DEE2E6] dark:border-[#333]"
                              />
                              <button
                                onClick={() => {
                                  const newStaff = [...data.globalStaff];
                                  newStaff[i] = { ...newStaff[i], photoUrl: undefined };
                                  setData(prev => ({ ...prev, globalStaff: newStaff }));
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs print:hidden"
                                title="清除照片"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer print:hidden">
                              <div className="w-[44px] h-[44px] mx-auto flex items-center justify-center border-2 border-dashed border-[#DEE2E6] dark:border-[#333] rounded-full hover:border-[#3498DB] transition-colors">
                                <span className="text-xl">📷</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const base64 = event.target?.result as string;
                                      const newStaff = [...data.globalStaff];
                                      newStaff[i] = { ...newStaff[i], photoUrl: base64 };
                                      setData(prev => ({ ...prev, globalStaff: newStaff }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </td>
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                          <EditableText
                            value={person.name}
                            onChange={(v) => {
                              const newStaff = [...data.globalStaff];
                              newStaff[i] = { ...newStaff[i], name: v };
                              setData(prev => ({ ...prev, globalStaff: newStaff }));
                            }}
                          />
                        </td>
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                          <select
                            value={person.team}
                            onChange={(e) => {
                              const newStaff = [...data.globalStaff];
                              newStaff[i] = { ...newStaff[i], team: e.target.value as '外場' | '內場' | '其他' };
                              setData(prev => ({ ...prev, globalStaff: newStaff }));
                            }}
                            className="w-full px-2 py-1 bg-transparent border border-[#DEE2E6] dark:border-[#333] rounded"
                          >
                            <option value="外場">外場</option>
                            <option value="內場">內場</option>
                            <option value="其他">其他</option>
                          </select>
                        </td>
                        <td className="border border-[#DEE2E6] dark:border-[#333] p-3">
                          <EditableText
                            value={person.note}
                            onChange={(v) => {
                              const newStaff = [...data.globalStaff];
                              newStaff[i] = { ...newStaff[i], note: v };
                              setData(prev => ({ ...prev, globalStaff: newStaff }));
                            }}
                          />
                        </td>
                        {(data.events || []).map((event) => {
                          const assignment = person.eventAssignments[event.eventId] || { status: '-' };
                          const isConfirmed = assignment.status === 'O';
                          
                          return (
                            <td key={event.eventId} className="border border-[#DEE2E6] dark:border-[#333] p-3 text-center">
                              <div className="flex flex-col items-center gap-2">
                                {/* Status Toggle Button */}
                                <button
                                  onClick={() => {
                                    const currentStatus = assignment.status;
                                    let nextStatus: '-' | 'O' | 'X';
                                    
                                    if (currentStatus === '-') {
                                      nextStatus = 'O';
                                    } else if (currentStatus === 'O') {
                                      nextStatus = 'X';
                                    } else {
                                      nextStatus = '-';
                                    }
                                    
                                    // Check if changing from O to X/- and person is in event staff
                                    if (currentStatus === 'O' && nextStatus !== 'O') {
                                      const isInEventStaff = data.staffMembers.some(
                                        s => s.eventId === event.eventId && s.name === person.name
                                      );
                                      
                                      if (isInEventStaff) {
                                        if (!window.confirm(
                                          `${person.name} 已在 ${event.name} 的員工班表中。\n改為「${nextStatus === 'X' ? '不出勤' : '未確認'}」將會移除該員工。\n\n確定要繼續嗎？`
                                        )) {
                                          return;
                                        }
                                        
                                        // Remove from event staff
                                        const updatedStaffMembers = data.staffMembers.filter(
                                          s => !(s.eventId === event.eventId && s.name === person.name)
                                        );
                                        setData(prev => ({ ...prev, staffMembers: updatedStaffMembers }));
                                      }
                                    }
                                    
                                    const newStaff = [...data.globalStaff];
                                    newStaff[i] = {
                                      ...newStaff[i],
                                      eventAssignments: { 
                                        ...newStaff[i].eventAssignments, 
                                        [event.eventId]: { 
                                          status: nextStatus,
                                          arrival: nextStatus === 'O' ? (assignment.arrival || '09:00') : undefined,
                                          departure: nextStatus === 'O' ? (assignment.departure || '17:00') : undefined
                                        }
                                      },
                                    };
                                    setData(prev => ({ ...prev, globalStaff: newStaff }));
                                  }}
                                  className={`w-9 h-9 rounded-full transition-colors font-bold flex items-center justify-center mx-auto ${
                                    assignment.status === '-' 
                                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300' :
                                    assignment.status === 'O' 
                                      ? 'bg-green-500 text-white' :
                                    'bg-red-500 text-white'
                                  }`}
                                  title={`點擊切換出勤狀態\n－（未確認）→ О（出勤）→ Х（不出勤）→ －`}
                                >
                                  {assignment.status === '-' ? '－' : assignment.status}
                                </button>
                                
                                {/* Time Selectors (only show when status is O) */}
                                {isConfirmed && (
                                  <div className="flex flex-col gap-1 w-full print:hidden">
                                    <select
                                      value={assignment.arrival || '09:00'}
                                      onChange={(e) => {
                                        const newStaff = [...data.globalStaff];
                                        newStaff[i] = {
                                          ...newStaff[i],
                                          eventAssignments: {
                                            ...newStaff[i].eventAssignments,
                                            [event.eventId]: {
                                              ...assignment,
                                              arrival: e.target.value
                                            }
                                          }
                                        };
                                        setData(prev => ({ ...prev, globalStaff: newStaff }));
                                      }}
                                      className="text-xs px-1 py-0.5 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
                                      title="到場時間"
                                    >
                                      {generateTimeOptions().map(time => (
                                        <option key={time} value={time}>↓{time}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={assignment.departure || '17:00'}
                                      onChange={(e) => {
                                        const newStaff = [...data.globalStaff];
                                        newStaff[i] = {
                                          ...newStaff[i],
                                          eventAssignments: {
                                            ...newStaff[i].eventAssignments,
                                            [event.eventId]: {
                                              ...assignment,
                                              departure: e.target.value
                                            }
                                          }
                                        };
                                        setData(prev => ({ ...prev, globalStaff: newStaff }));
                                      }}
                                      className="text-xs px-1 py-0.5 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
                                      title="離場時間"
                                    >
                                      {generateTimeOptions().map(time => (
                                        <option key={time} value={time}>↑{time}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="border border-[#DEE2E6] border-dashed p-3 bg-gray-50 dark:bg-gray-900/30">
                          {/* Empty cell for "Add Event Column" alignment */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => {
                    const initialAssignments: { [eventId: string]: EventAssignment } = {};
                    data.events.forEach(event => {
                      initialAssignments[event.eventId] = { status: '-' };
                    });
                    
                    const newPerson: GlobalStaff = {
                      name: '新員工',
                      team: '外場',
                      note: '',
                      eventAssignments: initialAssignments
                    };
                    setData(prev => ({ ...prev, globalStaff: [...prev.globalStaff, newPerson] }));
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors print:hidden"
                >
                  <Plus className="w-4 h-4" />
                  新增員工
                </button>
              </div>

              {/* Tasks */}
              <h3 className="section-title">任務清單</h3>
              <div className="space-y-3">
                {data.globalTasks.map((task, i) => (
                  <EditableCheckbox
                    key={i}
                    checked={task.checked}
                    label={task.label}
                    onCheckedChange={(checked) => {
                      const newTasks = [...data.globalTasks];
                      newTasks[i] = { ...newTasks[i], checked: !!checked };
                      setData(prev => ({ ...prev, globalTasks: newTasks }));
                    }}
                    onLabelChange={(label) => {
                      const newTasks = [...data.globalTasks];
                      newTasks[i] = { ...newTasks[i], label };
                      setData(prev => ({ ...prev, globalTasks: newTasks }));
                    }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg p-8">
              <h2 className="text-2xl mb-6 pb-4 border-b-2 border-[#DEE2E6] dark:border-[#333] text-[#2C3E50] dark:text-[#E0E0E0]">
                <EditableText
                  value={data.settingsTitle}
                  onChange={(v) => setData(prev => ({ ...prev, settingsTitle: v }))}
                />
              </h2>

              {/* Status Messages */}
              {syncStatus && (
                <div className={`mb-6 p-4 rounded-lg ${
                  syncStatus.includes('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 
                  syncStatus.includes('❌') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                }`}>
                  {syncStatus}
                </div>
              )}

              {/* ① Google Sheets 同步設定 */}
              <div className="mb-8 pb-8 border-b border-[#DEE2E6] dark:border-[#333]">
                <h3 className="section-title">① Google Sheets 同步設定</h3>
                
                <div className="space-y-4">
                  {/* URL Input */}
                  <div>
                    <label className="block text-sm mb-2 text-[#666] dark:text-[#AAA]">
                      GAS Web App URL
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={gasUrlInput}
                        onChange={(e) => setGasUrlInput(e.target.value)}
                        placeholder="https://script.google.com/macros/s/..."
                        className="flex-1 px-4 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
                      />
                      <button
                        onClick={handleSaveGasUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors"
                      >
                        🔗 儲存 URL
                      </button>
                    </div>
                  </div>

                  {/* Current URL Display */}
                  {gasUrl && (
                    <div className="text-sm text-[#666] dark:text-[#AAA]">
                      目前已設定的 URL：
                      <code className="ml-2 px-2 py-1 bg-[#F8F9FA] dark:bg-[#2C3E50] rounded text-xs">
                        {gasUrl.length > 40 ? gasUrl.substring(0, 40) + '...' : gasUrl}
                      </code>
                    </div>
                  )}

                  {/* Sync Buttons */}
                  <div className="flex gap-3">
                    {/* Real-time Sync Button */}
                    <button
                      onClick={handleRealTimeSync}
                      disabled={isRealTimeSyncing || !gasUrl}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        realTimeSyncStatus === 'success' ? 'bg-green-500 text-white' :
                        realTimeSyncStatus === 'error' ? 'bg-red-500 text-white' :
                        realTimeSyncStatus === 'syncing' ? 'bg-blue-400 text-white' :
                        'bg-[#3498DB] hover:bg-[#2C7CB8] text-white'
                      }`}
                    >
                      {realTimeSyncStatus === 'syncing' && <RefreshCw className="w-5 h-5 animate-spin" />}
                      {realTimeSyncStatus === 'success' && <Check className="w-5 h-5" />}
                      {realTimeSyncStatus === 'error' && <X className="w-5 h-5" />}
                      {realTimeSyncStatus === 'idle' && <span>☁️</span>}
                      <span>
                        {realTimeSyncStatus === 'syncing' ? '同步中…' :
                         realTimeSyncStatus === 'success' ? '已同步' :
                         realTimeSyncStatus === 'error' ? '失敗' :
                         '即時同步'}
                      </span>
                    </button>
                  </div>
                  
                  {realTimeSyncError && (
                    <p className="mt-2 text-sm text-red-500">{realTimeSyncError}</p>
                  )}
                  
                  {lastSyncTime && (
                    <p className="mt-2 text-sm text-[#666] dark:text-[#AAA]">
                      最後同步時間：{lastSyncTime}
                    </p>
                  )}

                  {/* Auto-sync toggle */}
                  <div className="mt-4 pt-4 border-t border-[#DEE2E6] dark:border-[#333]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#333] dark:text-[#E0E0E0]">
                            🔄 自動同步
                          </span>
                          {autoSync && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              已啟用
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#666] dark:text-[#AAA]">
                          每 30 秒自動從 Sheets 拉取最新資料
                        </p>
                      </div>
                      <button
                        onClick={handleToggleAutoSync}
                        disabled={!gasUrl}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          autoSync ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoSync ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {!gasUrl && (
                      <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ 請先設定並儲存 GAS URL 才能啟用自動同步
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ② ��料匯入 */}
              <div className="mb-8 pb-8 border-b border-[#DEE2E6] dark:border-[#333]">
                <h3 className="section-title">② 資料匯入</h3>
                
                <button
                  onClick={handleImportFromSheets}
                  disabled={isImporting || !gasUrl}
                  className="flex items-center gap-2 px-6 py-3 bg-[#3498DB] text-white rounded-lg hover:bg-[#2C7CB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>匯入中...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      📥 從 Sheets 匯入
                    </>
                  )}
                </button>
                
                <p className="mt-3 text-sm text-[#666] dark:text-[#AAA]">
                  從 Google Sheets 取得最新資料並完整覆蓋本地資料。任何裝置都可透過「匯入」同步最新狀態
                </p>
              </div>

              {/* ③ 資料管理 */}
              <div className="mb-8">
                <h3 className="section-title">③ 資料管理</h3>
                
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-2 px-6 py-3 bg-[#F39C12] text-white rounded-lg hover:bg-[#E67E22] transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    💾 匯出 JSON
                  </button>
                  
                  <button
                    onClick={handleClearAllData}
                    className="flex items-center gap-2 px-6 py-3 bg-[#E74C3C] text-white rounded-lg hover:bg-[#C0392B] transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    🗑️ 清除所有資料
                  </button>
                </div>
                
                <p className="mt-3 text-sm text-[#666] dark:text-[#AAA]">
                  建議定期���出 JSON 檔案作為備份
                </p>
              </div>

              {/* Note */}
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ 注意：</strong>桌位配置圖片僅保存在本機瀏覽器，不會同步至 Google Sheets
                </p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Auto-sync Toast */}
      {autoSyncToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className="bg-[#2C3E50] dark:bg-[#1E1E1E] text-white px-6 py-3 rounded-lg shadow-2xl border border-[#3498DB]">
            {autoSyncToast}
          </div>
        </div>
      )}

      {/* Add Event Column Dialog */}
      {showAddEventDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-[#2C3E50] dark:text-[#E0E0E0]">
              新增場次
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#333] dark:text-[#E0E0E0]">
                  活動名稱
                </label>
                <input
                  type="text"
                  value={newEventColumnName}
                  onChange={(e) => setNewEventColumnName(e.target.value)}
                  placeholder="例如：3/14午宴"
                  className="w-full px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#333] dark:text-[#E0E0E0]">
                  日期
                </label>
                <input
                  type="date"
                  value={newEventColumnDate}
                  onChange={(e) => setNewEventColumnDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#333] dark:text-[#E0E0E0]">
                  時段 <span className="text-gray-500 text-xs">(可選填)</span>
                </label>
                <input
                  type="text"
                  value={newEventColumnTimeSlot}
                  onChange={(e) => setNewEventColumnTimeSlot(e.target.value)}
                  placeholder="例如：10:00-14:00"
                  className="w-full px-3 py-2 border border-[#DEE2E6] dark:border-[#333] rounded bg-white dark:bg-[#2C3E50] text-[#333] dark:text-[#E0E0E0]"
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                ℹ️ 新增後，系統會自動建立新場次並在人員庫新增對應欄位，所有員工預設值為：出勤 O、到場 10:00、離場 22:00
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddEventColumn}
                disabled={!newEventColumnName || !newEventColumnDate}
                className="flex-1 px-4 py-2 bg-[#3498DB] text-white rounded hover:bg-[#2C7CB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                確認新增
              </button>
              <button
                onClick={() => {
                  setShowAddEventDialog(false);
                  setNewEventColumnName('');
                  setNewEventColumnDate('');
                  setNewEventColumnTimeSlot('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          * {
            background: white !important;
            color: black !important;
            border-color: #ccc !important;
          }
        }
      `}</style>
    </div>
  );
}
