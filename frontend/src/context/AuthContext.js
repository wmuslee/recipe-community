'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rc_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem('rc_token'); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('rc_token', data.token);
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await authAPI.register({ username, email, password });
    localStorage.setItem('rc_token', data.token);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rc_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => setUser(u => ({ ...u, ...patch })), []);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
