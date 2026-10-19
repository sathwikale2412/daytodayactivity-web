import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './db/database';
import Navbar from './components/Navbar';
import SchedulerScreen from './components/SchedulerScreen';
import RoutineScreen from './components/RoutineScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import AddTaskModal from './components/AddTaskModal';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import { Sparkles, ArrowRight } from 'lucide-react';
import { todayStr } from './lib/date';

function MainApp() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('scheduler'); // 'scheduler', 'routine', 'analytics'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Data states
  const [tasks, setTasks] = useState([]);
  const [routineItems, setRoutineItems] = useState([]);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState(null);

  // Modal states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current active user ID (or fallback guest ID: 1)
  const currentUserId = user?.id || 1;

  // Load Tasks for selected date
  const loadTasks = useCallback(async () => {
    try {
      const data = await db.getTasks(currentUserId, selectedDate);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, [currentUserId, selectedDate]);

  // Load Routines
  const loadRoutines = useCallback(async () => {
    try {
      const data = await db.getRoutines(currentUserId);
      setRoutineItems(data);
    } catch (err) {
      console.error('Failed to load routines:', err);
    }
  }, [currentUserId]);

  // Load Weekly Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await db.getWeeklyAnalytics(currentUserId);
      setWeeklyAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, [currentUserId]);

  // Refresh all data
  const refreshAll = useCallback(() => {
    loadTasks();
    loadRoutines();
    loadAnalytics();
  }, [loadTasks, loadRoutines, loadAnalytics]);

  // AuthModal keeps the onClose prop from before sign-in, so a refresh called
  // after its async demo flow would still target the guest user id.
  const refreshAllRef = useRef(refreshAll);
  useEffect(() => {
    refreshAllRef.current = refreshAll;
  });

  useEffect(() => {
    refreshAll();
  }, [refreshAll, user]);

  // Action handlers
  const handleToggleTask = async (task) => {
    const updated = { ...task, isCompleted: !task.isCompleted };
    await db.updateTask(updated);
    await loadTasks();
    await loadAnalytics();
  };

  const handleDeleteTask = async (task) => {
    await db.deleteTask(task.id);
    await loadTasks();
    await loadAnalytics();
  };

  const handleAddTask = async (taskData) => {
    await db.addTask({ ...taskData, userId: currentUserId });
    await loadTasks();
    await loadAnalytics();
  };

  const handleAddRoutineItem = async (routineData) => {
    await db.addRoutine({ ...routineData, userId: currentUserId });
    await loadRoutines();
  };

  const handleDeleteRoutineItem = async (item) => {
    await db.deleteRoutine(item.id);
    await loadRoutines();
  };

  // Convert routines to tasks for selectedDate
  const handlePopulateScheduleFromRoutine = async () => {
    const [year, month, day] = selectedDate.split('-').map(Number);

    for (const r of routineItems) {
      const startDate = new Date(year, month - 1, day, r.startTimeHour, r.startTimeMinute, 0, 0);
      const endDate = new Date(year, month - 1, day, r.endTimeHour, r.endTimeMinute, 0, 0);

      // Only add if not already existing
      const existing = tasks.find(t => t.title === r.title && t.date === selectedDate);
      if (!existing) {
        await db.addTask({
          userId: currentUserId,
          title: r.title,
          description: `Scheduled from routine (${r.category})`,
          date: selectedDate,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          category: r.category || 'Routine',
          isCompleted: false
        });
      }
    }
    await loadTasks();
    await loadAnalytics();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-glow-blue" />
          <p className="text-xs font-mono text-white/50 tracking-wider">INITIALIZING APP & DATABASE...</p>
        </div>
      </div>
    );
  }

  const profileName = user?.name || profile?.name || 'Explorer';
  const goalCount = user?.dailyGoalCount || profile?.dailyGoalCount || 5;

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-white selection:bg-primary selection:text-white">
      
      {/* Top Banner if Not Logged In */}
      {!user && (
        <div className="bg-gradient-to-r from-primary/20 via-secondary-indigo/20 to-accent-teal/20 border-b border-white/10 px-4 py-2 text-center text-xs text-white/90 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent-teal shrink-0" />
          <span>You are using <strong>Guest Mode</strong>. All data is saved to your browser database.</span>
          <button
            onClick={() => setIsAuthOpen(true)}
            className="ml-2 underline font-semibold text-accent-teal hover:text-white flex items-center gap-1 transition-colors"
          >
            Sign In / Create Account <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => {
          if (!user) setIsAuthOpen(true);
          else setIsProfileOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8">
        {activeTab === 'scheduler' && (
          <SchedulerScreen
            tasks={tasks}
            profileName={profileName}
            goalCount={goalCount}
            currentTime={currentTime}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onNavigateToRoutine={() => setActiveTab('routine')}
            onNavigateToAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'routine' && (
          <RoutineScreen
            routineItems={routineItems}
            currentTime={currentTime}
            onAddRoutineItem={handleAddRoutineItem}
            onDeleteRoutineItem={handleDeleteRoutineItem}
            onPopulateScheduleFromRoutine={handlePopulateScheduleFromRoutine}
            onBack={() => setActiveTab('scheduler')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen
            weeklyData={weeklyAnalytics}
            onBack={() => setActiveTab('scheduler')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Day to Day Activity. Built for consistency and peak performance.</p>
          <div className="flex items-center gap-4 text-white/50">
            <span>IndexedDB Persistent Storage</span>
            <span>•</span>
            <span>Encrypted Auth</span>
            <span>•</span>
            <span>Material 3 Glassmorphism</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        defaultDate={selectedDate}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          refreshAllRef.current();
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
