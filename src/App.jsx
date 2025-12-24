import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Calendar as CalIcon, BarChart as ChartIcon, Save, X } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';
import { format, parseISO, isSameDay, getMonth, getYear } from 'date-fns';
import { he } from 'date-fns/locale';

const App = () => {
  // --- State Management ---
  const [view, setView] = useState('calendar'); // 'calendar' or 'stats'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Load data from local storage or set defaults
  const [absences, setAbsences] = useState(() => {
    const saved = localStorage.getItem('work_absences');
    return saved ? JSON.parse(saved) : [];
  });

  const [reasons, setReasons] = useState(() => {
    const saved = localStorage.getItem('work_reasons');
    return saved ? JSON.parse(saved) : ['מחלה', 'חופש', 'מילואים', 'סידורים', 'אחר'];
  });

  const [newReason, setNewReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  // Set initial selected reason when reasons load
  useEffect(() => {
    if (reasons.length > 0 && !selectedReason) {
      setSelectedReason(reasons[0]);
    }
  }, [reasons, selectedReason]);

  // --- Effects to Save Data ---
  useEffect(() => {
    localStorage.setItem('work_absences', JSON.stringify(absences));
  }, [absences]);

  useEffect(() => {
    localStorage.setItem('work_reasons', JSON.stringify(reasons));
  }, [reasons]);

  // --- Handlers ---
  const handleAddReason = () => {
    if (newReason && !reasons.includes(newReason)) {
      const updatedReasons = [...reasons, newReason];
      setReasons(updatedReasons);
      setSelectedReason(newReason); // Auto select the new one
      setNewReason('');
    }
  };

  const handleDeleteReason = (reasonToDelete) => {
    if (window.confirm(`למחוק את הקטגוריה "${reasonToDelete}"?`)) {
      const updatedReasons = reasons.filter(r => r !== reasonToDelete);
      setReasons(updatedReasons);
      
      // If we deleted the currently selected reason, switch to the first available one
      if (selectedReason === reasonToDelete && updatedReasons.length > 0) {
        setSelectedReason(updatedReasons[0]);
      } else if (updatedReasons.length === 0) {
        setSelectedReason('');
      }
    }
  };

  const handleSaveAbsence = () => {
    if (!selectedReason) return; // Guard against empty reason list

    // Remove any existing entry for this date first to avoid duplicates
    const filtered = absences.filter(a => !isSameDay(parseISO(a.date), selectedDate));
    
    const newEntry = {
      date: selectedDate.toISOString(),
      reason: selectedReason,
      month: getMonth(selectedDate),
      year: getYear(selectedDate)
    };
    
    setAbsences([...filtered, newEntry]);
  };

  const handleDeleteAbsence = () => {
    const filtered = absences.filter(a => !isSameDay(parseISO(a.date), selectedDate));
    setAbsences(filtered);
  };

  // --- Helpers for Visualization ---
  const getAbsenceRecord = (date) => {
    return absences.find(a => isSameDay(parseISO(a.date), date));
  };

  const currentRecord = getAbsenceRecord(selectedDate);

  // --- Statistics Calculation ---
  const getReasonStats = () => {
    const stats = {};
    absences.forEach(a => {
      stats[a.reason] = (stats[a.reason] || 0) + 1;
    });
    return Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
  };

  const getMonthlyStats = () => {
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const stats = new Array(12).fill(0);
    
    absences.forEach(a => {
      if (a.year === new Date().getFullYear()) {
        stats[a.month] += 1;
      }
    });

    return months.map((m, i) => ({ name: m, days: stats[i] }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7373', '#6b7280'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold text-gray-900">מעקב נוכחות בצבא</h1>
            <p className="text-gray-500">ניהול ימי היעדרות וסטטיסטיקות</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border">
            <button 
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${view === 'calendar' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              <CalIcon size={18} /> לוח שנה
            </button>
            <button 
              onClick={() => setView('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${view === 'stats' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
            >
              <ChartIcon size={18} /> סטטיסטיקות
            </button>
          </div>
        </header>

        {/* Input & Management Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          
          {/* Top Row: Date & Action */}
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">ניהול יום נבחר</h2>
          <div className="flex flex-wrap gap-6 items-end mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
              <input 
                type="date" 
                className="border rounded-md px-3 py-2 w-40 bg-gray-50"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            {currentRecord ? (
               <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700 mb-1">סטטוס נוכחי:</span>
                  <div className="flex items-center gap-4 bg-green-50 px-4 py-1.5 rounded-md border border-green-200">
                      <span className="font-bold text-green-700">{currentRecord.reason}</span>
                      <button 
                        onClick={handleDeleteAbsence}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm hover:underline"
                        title="מחק היעדרות (חזרה לעבודה)"
                      >
                        <Trash2 size={16} /> ביטול היעדרות
                      </button>
                  </div>
               </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סיבת היעדרות</label>
                  <select 
                    className="border rounded-md px-3 py-2 w-48 bg-white"
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  >
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <button 
                  onClick={handleSaveAbsence}
                  disabled={!selectedReason}
                  className={`flex items-center gap-2 text-white px-6 py-2 rounded-md shadow-sm transition-colors ${!selectedReason ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Save size={18} /> שמור היעדרות
                </button>
              </>
            )}
          </div>
          
          {/* Bottom Row: Category Management (Add/Remove) */}
          <div className="mt-6 pt-4 border-t bg-gray-50 -m-6 mb-0 p-6 rounded-b-xl">
            <span className="block text-sm font-bold text-gray-700 mb-3">ניהול קטגוריות (הוספה / הסרה)</span>
            
            <div className="flex flex-wrap gap-2 items-center">
              {/* Existing Tags */}
              {reasons.map(r => (
                <div key={r} className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-1 rounded-full text-sm shadow-sm group hover:border-red-300 transition-colors">
                  <span>{r}</span>
                  <button 
                    onClick={() => handleDeleteReason(r)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                    title={`מחק את ${r}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Add New Input */}
              <div className="flex items-center gap-2 mr-2 border-r pr-4 border-gray-300">
                <input 
                  type="text" 
                  placeholder="קטגוריה חדשה..." 
                  className="border rounded-md px-3 py-1 text-sm w-32 focus:w-48 transition-all"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddReason()}
                />
                <button 
                  onClick={handleAddReason} 
                  className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                  title="הוסף קטגוריה"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* VIEW: CALENDAR */}
        {view === 'calendar' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-6 text-sm justify-center md:justify-start">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded shadow-sm"></div> נכח בצבא</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border border-green-500 rounded shadow-sm"></div> נעדר</div>
            </div>
            
            <Calendar 
              locale="he-IL"
              onChange={setSelectedDate} 
              value={selectedDate}
              className="w-full text-lg shadow-sm rounded-lg overflow-hidden border-none"
              tileClassName={({ date, view }) => {
                if (view === 'month') {
                  const record = getAbsenceRecord(date);
                  const baseClasses = "transition-colors flex flex-col items-center justify-start pt-2 relative w-full h-full";                  return record 
                    ? `${baseClasses} bg-green-100 hover:bg-green-200 text-green-900` 
                    : `${baseClasses} bg-red-50 hover:bg-red-100 text-red-900`;
                }
              }}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const record = getAbsenceRecord(date);
                  return record ? (
                    <div className="text-xs font-bold mt-1 px-2 py-0.5 bg-green-200 rounded-full text-green-800 truncate max-w-[90%]">
                      {record.reason}
                    </div>
                  ) : (
                    <div className="text-[10px] font-medium text-red-300 mt-2">
                       בצבא
                    </div>
                  );
                }
              }}
            />
          </div>
        )}

        {/* VIEW: STATISTICS */}
        {view === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* KPI Cards */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-gray-500 text-sm uppercase font-bold">סה"כ ימי היעדרות</h3>
                <p className="text-4xl font-bold text-blue-600 mt-2">{absences.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                 <h3 className="text-gray-500 text-sm uppercase font-bold">הסיבה הנפוצה ביותר</h3>
                 <p className="text-xl font-bold text-gray-800 mt-3">
                   {getReasonStats().sort((a,b) => b.value - a.value)[0]?.name || '-'}
                 </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                 <h3 className="text-gray-500 text-sm uppercase font-bold">שנה נוכחית</h3>
                 <p className="text-xl font-bold text-gray-800 mt-3">{new Date().getFullYear()}</p>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
              <h3 className="font-bold text-gray-700 mb-4 text-center">התפלגות סיבות</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getReasonStats()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {getReasonStats().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
              <h3 className="font-bold text-gray-700 mb-4 text-center">היעדרויות לפי חודש (השנה)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthlyStats()}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="days" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default App;