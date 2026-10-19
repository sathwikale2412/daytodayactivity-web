import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Target, 
  Volume2, 
  Bell, 
  Download, 
  Upload, 
  Check, 
  LogOut, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/database';
import { notificationService } from '../services/notifications';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, profile, updateProfile, logout } = useAuth();
  
  const [name, setName] = useState('');
  const [dailyGoalCount, setDailyGoalCount] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDailyGoalCount(user.dailyGoalCount || 5);
    }
    if (profile) {
      if (typeof profile.soundEnabled === 'boolean') setSoundEnabled(profile.soundEnabled);
      if (typeof profile.notificationsEnabled === 'boolean') setNotifEnabled(profile.notificationsEnabled);
    }
    setNotifEnabled(notificationService.hasPermission);
  }, [user, profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim(),
      dailyGoalCount: Number(dailyGoalCount) || 5,
      soundEnabled,
      notificationsEnabled: notifEnabled
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleRequestNotif = async () => {
    const granted = await notificationService.requestPermission();
    setNotifEnabled(granted);
  };

  const handleExportBackup = async () => {
    if (!user) return;
    try {
      const backup = await db.exportData(user.id);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daytodayactivity_backup_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg('Database exported successfully!');
      setTimeout(() => setBackupMsg(''), 3000);
    } catch (err) {
      setBackupMsg('Export failed: ' + err.message);
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          await db.importData(user.id, parsed);
          setBackupMsg('Database restored successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          setBackupMsg('Import error: ' + err.message);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setBackupMsg('Failed to read file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-dark-surface/95 border border-white/15 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-accent-teal flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Profile & Preferences</h3>
              <p className="text-xs text-white/50">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Daily Task Goal Target</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={dailyGoalCount}
                onChange={(e) => setDailyGoalCount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-primary transition-colors"
              />
              <span className="text-xs text-white/50 whitespace-nowrap">tasks / day</span>
            </div>
            <p className="text-[11px] text-white/40 mt-1">Recommended: 3 to 7 tasks daily for sustained focus.</p>
          </div>

          {/* Sound & Notifications Toggles */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <Volume2 className="w-4 h-4 text-accent-teal" />
                <span>Audio Chimes & Feedback</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs font-medium text-white">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>Desktop Task Reminders</span>
              </div>
              {notifEnabled ? (
                <span className="text-[11px] font-mono text-emerald-400">Enabled</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotif}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Backup & Restore Database Section */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <p className="text-xs font-semibold text-white/80">Database Backup & Portability</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-accent-teal" />
                <span>Export JSON</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
            {backupMsg && (
              <p className="text-[11px] text-accent-teal font-medium mt-1">{backupMsg}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-glow-blue transition-colors flex items-center gap-1.5"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{saveSuccess ? 'Saved!' : 'Save Profile'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
