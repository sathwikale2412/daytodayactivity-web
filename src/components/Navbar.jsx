import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BarChart3, 
  ListTodo, 
  User, 
  Volume2, 
  VolumeX, 
  Bell, 
  BellRing,
  LogOut, 
  Settings, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundService } from '../services/sound';
import { notificationService } from '../services/notifications';

export default function Navbar({ activeTab, setActiveTab, onOpenProfile, onOpenAuth }) {
  const { user, profile, logout } = useAuth();
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifGranted, setNotifGranted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setCurrentDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile && typeof profile.soundEnabled === 'boolean') {
      setSoundEnabled(profile.soundEnabled);
    }
    setNotifGranted(notificationService.hasPermission);
  }, [profile]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setEnabled(next);
    if (next) soundService.playTaskComplete();
  };

  const handleRequestNotif = async () => {
    const granted = await notificationService.requestPermission();
    setNotifGranted(granted);
  };

  const navItems = [
    { id: 'scheduler', label: 'SCHEDULER', icon: ListTodo },
    { id: 'routine', label: 'ROUTINE', icon: Calendar },
    { id: 'analytics', label: 'ANALYTICS', icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-dark-bg/80 border-b border-white/10 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand & Live Clock */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab('scheduler')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent-teal flex items-center justify-center shadow-glow-blue group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                DayToDay <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-accent-teal font-mono">Activity</span>
              </h1>
              <p className="text-xs text-white/50">Consistent Daily Timetable</p>
            </div>
          </div>

          {/* Real-time Clock Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/90">
            <Clock className="w-3.5 h-3.5 text-accent-teal animate-pulse" />
            <span>{currentTimeStr || '00:00:00'}</span>
            <span className="text-white/40 hidden md:inline">|</span>
            <span className="text-white/60 hidden md:inline">{currentDateStr}</span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'text-white bg-primary shadow-glow-blue' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Sound, Notifications & User Profile */}
        <div className="flex items-center gap-2">
          
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Audio Chimes'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-accent-teal" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>

          {/* Browser Notification Toggle */}
          <button
            onClick={handleRequestNotif}
            title={notifGranted ? 'Notifications Active' : 'Enable Desktop Notifications'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
          >
            {notifGranted ? <BellRing className="w-4 h-4 text-emerald-400" /> : <Bell className="w-4 h-4 text-white/40" />}
          </button>

          {/* Profile / Auth Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-secondary-indigo to-primary flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <span className="text-xs font-medium max-w-[80px] md:max-w-[120px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-dark-surface/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-semibold text-white">{user.name}</p>
                      <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-accent-teal">
                        <span>Daily Goal:</span>
                        <span className="font-bold">{user.dailyGoalCount || 5} tasks</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-primary" />
                      <span>Profile & Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-glow-blue transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login / Sign Up</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
