'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, recipesAPI } from '@/lib/api';
import s from './favorites.module.css';

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState([]);
  const [fetching, setFetching] = useState(true);

  // перенаправление на страницу входа, если пользователь не авторизован
  useEffect(() => { if (!loading && !user) router.push('/auth/login'); }, [user, loading, router]);

  // загрузка сохраненных рецептов при входе пользователя
  useEffect(() => {
    if (user) {
      usersAPI.getSaved(user._id)
        .then(setSaved)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user]);

  // функция для удаления рецепта из сохраненных
  const unsave = async (id) => {
    try {
      await recipesAPI.save(id); // toggles
      setSaved(p => p.filter(r => r._id !== id));
    } catch (err) { alert(err.message); }
  };

  if (loading || fetching) return <div className="spinner" />;
  if (!user) return null;

  return (
    <div className={s.page}>
      <div className="container">
        <div className={s.header}>
          <h1>🔖 Saved Recipes</h1>
          <p>{saved.length} recipe{saved.length !== 1 ? 's' : ''} saved</p>
        </div>

        {saved.length === 0 ? (
          <div className={s.empty}>
            <span>🍽️</span>
            <h3>No saved recipes yet</h3>
            <p>Browse recipes and click the save button to bookmark your favorites.</p>
            <Link href="/recipes" className="btn btn-primary">Explore Recipes</Link>
          </div>
        ) : (
          <div className="grid-recipes">
            {saved.map(r => (
              <div key={r._id} className={`card ${s.rCard}`}>
                <Link href={`/recipes/${r._id}`} className={s.rLink}>
                  <div className={s.rImg}>
                    {r.image
                      ? <img src={r.image} alt={r.title} />
                      : <div className={s.rImgPh}>🍽️</div>
                    }
                    <span className={`badge badge-${r.difficulty} ${s.diff}`}>{r.difficulty}</span>
                  </div>
                  <div className={s.rBody}>
                    <h3>{r.title}</h3>
                    <p>{r.description}</p>
                    <div className={s.rMeta}>
                      <span>⏱ {r.cookingTime}m</span>
                      <span>❤️ {r.likesCount || 0}</span>
                    </div>
                    {r.author && (
                      <div className={s.rAuthor}>
                        <span className={s.avPh}>{r.author.username?.[0]?.toUpperCase()}</span>
                        <span>{r.author.username}</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className={s.rFooter}>
                  <button className="btn btn-ghost btn-sm" onClick={() => unsave(r._id)}>
                    🔖 Unsave
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
