import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/database';
import { soundService } from '../services/sound';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedSession = localStorage.getItem('daytoday_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.userId) {
            const userData = await db.getUserById(parsed.userId);
            if (userData) {
              setUser(userData);
              const prof = await db.getProfile(userData.id);
              setProfile(prof);
              if (prof && typeof prof.soundEnabled === 'boolean') {
                soundService.setEnabled(prof.soundEnabled);
              }
            }
          }
        }
      } catch (err) {
        console.error('Session restore error:', err);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await db.authenticateUser(email, password);
    setUser(res.user);
    const prof = await db.getProfile(res.user.id);
    setProfile(prof);
    if (prof && typeof prof.soundEnabled === 'boolean') {
      soundService.setEnabled(prof.soundEnabled);
    }
    return res.user;
  };

  const signup = async ({ email, password, name, dailyGoalCount = 5 }) => {
    const newUser = await db.createUser({ email, password, name, dailyGoalCount });
    // Automatically log in after creating account
    return login(email, password);
  };

  const guestLogin = async () => {
    const demoEmail = 'guest@daytoday.app';
    const demoPassword = 'Password123!';
    try {
      return await login(demoEmail, demoPassword);
    } catch {
      // Create guest account if not exists
      await db.createUser({
        email: demoEmail,
        password: demoPassword,
        name: 'Guest Explorer',
        dailyGoalCount: 5
      });
      return await login(demoEmail, demoPassword);
    }
  };

  const logout = () => {
    localStorage.removeItem('daytoday_session');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return null;
    const updated = await db.updateProfile(user.id, updates);
    setProfile(updated);
    if (updates.name) {
      setUser(prev => ({ ...prev, name: updates.name }));
    }
    if (updates.dailyGoalCount) {
      setUser(prev => ({ ...prev, dailyGoalCount: updates.dailyGoalCount }));
    }
    if (typeof updates.soundEnabled === 'boolean') {
      soundService.setEnabled(updates.soundEnabled);
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        guestLogin,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
