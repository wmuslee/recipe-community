const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// универсальная функция для выполнения API-запросов с обработкой токена и ошибок
export async function apiFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('rc_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// набор API-функций для аутентификации, работы с рецептами, комментариями, категориями, тегами и пользователями
export const authAPI = {
  register: (b) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  login: (b) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(b) }),
  me: () => apiFetch('/api/auth/me'),
  updateProfile: (b) => apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify(b) }),
};

// API-функции для работы с рецептами, получение всех рецептов с фильтрацией, получение одного рецепта по ID, создание, обновление, удаление, лайк и сохранение рецепта,получение рецептов по пользователю
export const recipesAPI = {
  getAll: (p = {}) => apiFetch(`/api/recipes?${new URLSearchParams(p)}`),
  getOne: (id) => apiFetch(`/api/recipes/${id}`),
  create: (b) => apiFetch('/api/recipes', { method: 'POST', body: JSON.stringify(b) }),
  update: (id, b) => apiFetch(`/api/recipes/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id) => apiFetch(`/api/recipes/${id}`, { method: 'DELETE' }),
  like: (id) => apiFetch(`/api/recipes/${id}/like`, { method: 'POST' }),
  save: (id) => apiFetch(`/api/recipes/${id}/save`, { method: 'POST' }),
  byUser: (uid) => apiFetch(`/api/recipes/user/${uid}`),
};

// API-функции для работы с комментариями, включая получение комментариев по рецепту, создание, обновление, удаление и лайк комментария
export const commentsAPI = {
  getByRecipe: (rid) => apiFetch(`/api/comments/${rid}`),
  create: (rid, b) => apiFetch(`/api/comments/${rid}`, { method: 'POST', body: JSON.stringify(b) }),
  update: (id, b) => apiFetch(`/api/comments/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id) => apiFetch(`/api/comments/${id}`, { method: 'DELETE' }),
  like: (id) => apiFetch(`/api/comments/${id}/like`, { method: 'POST' }),
};

// API-функции для получения всех категорий и тегов, создания нового тега, а также получения профиля пользователя и его сохраненных рецептов
export const categoriesAPI = { getAll: () => apiFetch('/api/categories') };
export const tagsAPI = {
  getAll: () => apiFetch('/api/tags'),
  create: (b) => apiFetch('/api/tags', { method: 'POST', body: JSON.stringify(b) }),
};
export const usersAPI = {
  getProfile: (id) => apiFetch(`/api/users/${id}`),
  getSaved: (id) => apiFetch(`/api/users/${id}/saved`),
};
