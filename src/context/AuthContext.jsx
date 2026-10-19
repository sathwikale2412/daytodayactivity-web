import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, seedDefaultRoutines } from '../db/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { soundService } from '../services/sound';

const AuthContext = createContext(null);

function applySound(profile) {
  if (profile && typeof profile.soundEnabled === 'boolean') {
    soundService.setEnabled(profile.soundEnabled);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the profile row for a given user id and hydrate state.
  async function hydrateProfile(userId, fallbackName, fallbackGoal) {
    const prof = await db.getProfile(userId);
    setProfile(prof);
    setUser({
      id: userId,
      name: prof?.name || fallbackName || 'User',
      email: undefined,
      dailyGoalCount: prof?.dailyGoalCount ?? fallbackGoal ?? 5
    });
    applySound(prof);
    return prof;
  }

  useEffect(() => {
    if (isSupabaseConfigured) {
      let mounted = true;

      const loadFromSession = async (session) => {
        if (!session?.user) {
          if (mounted) { setUser(null); setProfile(null); }
          return;
        }
        const u = session.user;
        const prof = await db.getProfile(u.id);
        if (!mounted) return;
        setProfile(prof);
        setUser({
          id: u.id,
          name: prof?.name || u.user_metadata?.name || 'User',
          email: u.email,
          dailyGoalCount: prof?.dailyGoalCount ?? 5
        });
        applySound(prof);
      };

      supabase.auth.getSession().then(({ data }) => {
        loadFromSession(data.session).finally(() => mounted && setLoading(false));
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        loadFromSession(session);
      });

      return () => { mounted = false; subscription.unsubscribe(); };
    }

    // Local fallback: restore the on-device session.
    (async () => {
      try {
        const saved = localStorage.getItem('daytoday_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.userId) {
            const userData = await db.getUserById(parsed.userId);
            if (userData) {
              const prof = await db.getProfile(userData.id);
              setProfile(prof);
              setUser(userData);
              applySound(prof);
            }
          }
        }
      } catch (err) {
        console.error('Session restore error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      await hydrateProfile(data.user.id, data.user.user_metadata?.name);
      return data.user;
    }
    const res = await db.authenticateUser(email, password);
    const prof = await db.getProfile(res.user.id);
    setProfile(prof);
    setUser(res.user);
    applySound(prof);
    return res.user;
  };

  const signup = async ({ email, password, name, dailyGoalCount = 5 }) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) throw new Error(error.message);

      if (!data.session) {
        throw new Error('Account created. Check your email to confirm, then sign in.');
      }

      await db.updateProfile(data.user.id, {
        name,
        dailyGoalCount: Number(dailyGoalCount) || 5,
        soundEnabled: true,
        notificationsEnabled: true,
        theme: 'dark'
      });
      await seedDefaultRoutines(data.user.id);
      await hydrateProfile(data.user.id, name, dailyGoalCount);
      return data.user;
    }

    await db.createUser({ email, password, name, dailyGoalCount });
    return login(email, password);
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('daytoday_session');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return null;
    const updated = await db.updateProfile(user.id, updates);
    setProfile(updated);
    setUser((prev) => ({ ...prev, ...updates }));
    if (typeof updates.soundEnabled === 'boolean') {
      soundService.setEnabled(updates.soundEnabled);
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, signup, logout, updateProfile, cloud: isSupabaseConfigured }}
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
