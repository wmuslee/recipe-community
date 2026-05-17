const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

export const authAPI = {
  register: (b) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  login: (b) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(b) }),
  me: () => apiFetch('/api/auth/me'),
  updateProfile: (b) => apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify(b) }),
};

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

export const commentsAPI = {
  getByRecipe: (rid) => apiFetch(`/api/comments/${rid}`),
  create: (rid, b) => apiFetch(`/api/comments/${rid}`, { method: 'POST', body: JSON.stringify(b) }),
  update: (id, b) => apiFetch(`/api/comments/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete: (id) => apiFetch(`/api/comments/${id}`, { method: 'DELETE' }),
  like: (id) => apiFetch(`/api/comments/${id}/like`, { method: 'POST' }),
};

export const categoriesAPI = { getAll: () => apiFetch('/api/categories') };
export const tagsAPI = {
  getAll: () => apiFetch('/api/tags'),
  create: (b) => apiFetch('/api/tags', { method: 'POST', body: JSON.stringify(b) }),
};
export const usersAPI = {
  getProfile: (id) => apiFetch(`/api/users/${id}`),
  getSaved: (id) => apiFetch(`/api/users/${id}/saved`),
};
