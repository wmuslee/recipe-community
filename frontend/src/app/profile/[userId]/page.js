import Link from 'next/link';
import { notFound } from 'next/navigation';

// API URL из переменных окружения
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// функция для получения данных пользователя по ID
async function getUser(id) {
  try {
    const r = await fetch(`${API}/api/users/${id}`, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

// функция для получения рецептов пользователя по ID
async function getUserRecipes(id) {
  try {
    const r = await fetch(`${API}/api/recipes/user/${id}`, { next: { revalidate: 60 } });
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

// страница публичного профиля пользователя с его рецептами
export default async function PublicProfilePage({ params }) {
  const [user, recipes] = await Promise.all([getUser(params.userId), getUserRecipes(params.userId)]);
  if (!user) notFound();

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <div style={{ background: 'var(--warm-white)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-xl)', padding: 36, boxShadow: '0 4px 24px var(--shadow)', marginBottom: 40, display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--parchment)', border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--terracotta)', flexShrink: 0, overflow: 'hidden' }}>
            {user.avatar ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.7rem', marginBottom: 4 }}>{user.username}</h1>
            {user.bio && <p style={{ color: 'var(--muted)', marginBottom: 12 }}>{user.bio}</p>}
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>📖 {user.recipeCount} recipes shared</p>
          </div>
        </div>

        <h2 style={{ marginBottom: 24 }}>Recipes by {user.username}</h2>
        {recipes.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>No recipes yet.</p>
        ) : (
          <div className="grid-recipes">
            {recipes.map(r => (
              <Link key={r._id} href={`/recipes/${r._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }} className="card">
                <div style={{ height: 180, overflow: 'hidden', background: 'var(--parchment)', position: 'relative' }}>
                  {r.image
                    ? <img src={r.image} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🍽️</div>
                  }
                  <span className={`badge badge-${r.difficulty}`} style={{ position: 'absolute', top: 10, right: 10 }}>{r.difficulty}</span>
                </div>
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>{r.title}</h3>
                  <p style={{ fontSize: '.83rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
