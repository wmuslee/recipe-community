'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

const Ctx = createContext(null);

// провайдер для управления состоянием аутентификации и предоставления функций для входа, регистрации, выхода и обновления профиля
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // проверка наличия токена при загрузке приложения и получение данных пользователя, если токен существует
  useEffect(() => {
    const token = localStorage.getItem('rc_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem('rc_token'); })
      .finally(() => setLoading(false));
  }, []);

  // функция для входа пользователя, которая сохраняет токен в localStorage и обновляет состояние пользователя
  const login = useCallback(async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('rc_token', data.token);
    setUser(data);
    return data;
  }, []);

  // функция для регистрации нового пользователя, которая сохраняет токен в localStorage и обновляет состояние пользователя
  const register = useCallback(async (username, email, password) => {
    const data = await authAPI.register({ username, email, password });
    localStorage.setItem('rc_token', data.token);
    setUser(data);
    return data;
  }, []);

  // функция для выхода из аккаунта, которая удаляет токен из localStorage и сбрасывает состояние пользователя
  const logout = useCallback(() => {
    localStorage.removeItem('rc_token');
    setUser(null);
  }, []);

  // функция для обновления данных пользователя в состоянии, которая может быть использована после изменения профиля
  const updateUser = useCallback((patch) => setUser(u => ({ ...u, ...patch })), []);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

// пользовательский хук для доступа к контексту аутентификации, который обеспечивает удобный способ получения данных пользователя и функций аутентификации в компонентах
export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
