'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { recipesAPI, categoriesAPI, tagsAPI } from '@/lib/api';
import s from './recipes.module.css';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [cats, setCats] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '', difficulty: '', maxTime: '', tag: '', sort: 'newest' });

  // функция для получения списка рецептов с учетом текущих фильтров и пагинации
  const fetchRecipes = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      // формирование параметров запроса на основе фильтров и страницы
      const p = { page: pg, limit: 12 };
      Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
      // запрос к API для получения рецептов и обновление состояния с результатами и информацией о пагинации
      const data = await recipesAPI.getAll(p);
      setRecipes(data.recipes || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.currentPage || 1);
    } catch { setRecipes([]); }
    finally { setLoading(false); }
  }, [filters]);

  // загрузка рецептов при изменении фильтров или страницы 
  useEffect(() => { fetchRecipes(1); }, [fetchRecipes]);
  useEffect(() => {
    Promise.all([categoriesAPI.getAll(), tagsAPI.getAll()])
      .then(([c, t]) => { setCats(c); setTags(t); }).catch(() => {});
  }, []);

  // функции для обновления отдельных фильтров, очистки всех фильтров и проверки наличия активных фильтров
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clear = () => setFilters({ search: '', category: '', difficulty: '', maxTime: '', tag: '', sort: 'newest' });
  const hasFilter = Object.entries(filters).some(([k, v]) => v && k !== 'sort');

  return (
    <div className={s.page}>
      <div className="container">
        <div className={s.header}><h1>All Recipes</h1><p>Discover delicious recipes from our community</p></div>

        <input className={s.search} type="text" placeholder="🔍  Search by name or ingredient…"
          value={filters.search} onChange={e => set('search', e.target.value)} />

        <div className={s.layout}>
          <aside className={s.sidebar}>
            <div className={s.fs}><h3>Sort</h3>
              <select value={filters.sort} onChange={e => set('sort', e.target.value)}>
                <option value="newest">Newest</option>
                <option value="popular">Most Liked</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            <div className={s.fs}><h3>Category</h3>
              <div className={s.radios}>
                {[{_id:'',name:'All',icon:'🍽️'}, ...cats].map(c => (
                  <label key={c._id} className={s.radio}>
                    <input type="radio" name="cat" value={c._id} checked={filters.category===c._id} onChange={() => set('category', c._id)} />
                    {c.icon} {c.name}
                  </label>
                ))}
              </div>
            </div>

            <div className={s.fs}><h3>Difficulty</h3>
              <div className={s.radios}>
                {['','easy','medium','hard'].map(d => (
                  <label key={d} className={s.radio}>
                    <input type="radio" name="diff" value={d} checked={filters.difficulty===d} onChange={() => set('difficulty', d)} />
                    {d || 'All'}
                  </label>
                ))}
              </div>
            </div>

            <div className={s.fs}><h3>Max Time</h3>
              <select value={filters.maxTime} onChange={e => set('maxTime', e.target.value)}>
                <option value="">Any</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            {tags.length > 0 && (
              <div className={s.fs}><h3>Tags</h3>
                <div className={s.tagCloud}>
                  {tags.slice(0,15).map(t => (
                    <button key={t._id} className={`tag ${filters.tag===t._id ? s.tagActive : ''}`}
                      onClick={() => set('tag', filters.tag===t._id ? '' : t._id)}
                      style={filters.tag===t._id ? {background:t.color,color:'#fff',borderColor:t.color} : {}}
                    >{t.name}</button>
                  ))}
                </div>
              </div>
            )}

            {hasFilter && <button className="btn btn-ghost btn-sm" onClick={clear}>✕ Clear filters</button>}
          </aside>

          <div className={s.results}>
            {loading ? <div className="spinner"/> : recipes.length === 0 ? (
              <div className={s.empty}><span>🍽️</span><p>No recipes found. Try different filters!</p></div>
            ) : (
              <>
                <div className="grid-recipes">
                  {recipes.map(r => (
                    <Link key={r._id} href={`/recipes/${r._id}`} className={`card ${s.rLink}`}>
                      <div className={s.rImg}>
                        {r.image ? <img src={r.image} alt={r.title}/> : <div className={s.rImgPh}>🍽️</div>}
                        <span className={`badge badge-${r.difficulty} ${s.diff}`}>{r.difficulty}</span>
                      </div>
                      <div className={s.rBody}>
                        <h3>{r.title}</h3>
                        <p>{r.description}</p>
                        <div className={s.rMeta}><span>⏱ {r.cookingTime}m</span><span>🍽 {r.servings}</span><span>❤️ {r.likesCount||0}</span></div>
                        {r.tags?.length > 0 && <div className={s.rTags}>{r.tags.slice(0,3).map(t => <span key={t._id} className="tag">{t.name}</span>)}</div>}
                        {r.author && <div className={s.rAuthor}><span className={s.avPh}>{r.author.username?.[0]?.toUpperCase()}</span><span>{r.author.username}</span></div>}
                      </div>
                    </Link>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className={s.pages}>
                    {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                      <button key={p} className={`btn btn-sm ${p===page?'btn-primary':'btn-ghost'}`} onClick={()=>fetchRecipes(p)}>{p}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}