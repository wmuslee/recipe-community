import Link from 'next/link';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// функция для получения популярных рецептов
async function getFeatured() {
  try {
    const r = await fetch(`${API}/api/recipes?sort=popular&limit=6`, { next: { revalidate: 60 } });
    if (!r.ok) return [];
    return (await r.json()).recipes || [];
  } catch { return []; }
}

// функция для получения категорий
async function getCategories() {
  try {
    const r = await fetch(`${API}/api/categories`, { next: { revalidate: 300 } });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

// главная страница категориями и популярными рецептами
export default async function HomePage() {
  const [recipes, categories] = await Promise.all([getFeatured(), getCategories()]);

  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroTag}>🌿 A community for food lovers</p>
          <h1 className={styles.heroTitle}>Cook Together,<br /><em>Share Everything</em></h1>
          <p className={styles.heroSub}>Discover thousands of recipes, share your creations, and connect with passionate home cooks around the world.</p>
          <div className={styles.heroCta}>
            <Link href="/recipes" className="btn btn-primary btn-lg">Explore Recipes</Link>
            <Link href="/auth/register" className="btn btn-outline btn-lg">Join Free</Link>
          </div>
        </div>
        <div className={styles.heroStats}>
          {[['10k+','Recipes'],['5k+','Cooks'],['50+','Categories']].map(([n,l]) => (
            <div key={l} className={styles.stat}>
              <span className={styles.statN}>{n}</span>
              <span className={styles.statL}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section" style={{background:'var(--parchment)'}}>
          <div className="container">
            <h2 style={{marginBottom:32}}>Browse by Category</h2>
            <div className={styles.catGrid}>
              {categories.slice(0,8).map(cat => (
                <Link key={cat._id} href={`/recipes?category=${cat._id}`} className={styles.catCard} style={{'--cc': cat.color}}>
                  <span className={styles.catIcon}>{cat.icon}</span>
                  <span className={styles.catName}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Recipes */}
      <section className="section">
        <div className="container">
          <div className={styles.sHead}>
            <h2>Popular Recipes</h2>
            <Link href="/recipes" className="btn btn-outline btn-sm">View All →</Link>
          </div>
          {recipes.length > 0 ? (
            <div className="grid-recipes">
              {recipes.map(r => (
                <Link key={r._id} href={`/recipes/${r._id}`} className={`card ${styles.rCard}`}>
                  <div className={styles.rImg}>
                    {r.image ? <img src={r.image} alt={r.title}/> : <div className={styles.rImgPh}>🍽️</div>}
                    <span className={`badge badge-${r.difficulty} ${styles.diff}`}>{r.difficulty}</span>
                  </div>
                  <div className={styles.rBody}>
                    <h3 className={styles.rTitle}>{r.title}</h3>
                    <p className={styles.rDesc}>{r.description}</p>
                    <div className={styles.rMeta}>
                      <span>⏱ {r.cookingTime}m</span>
                      <span>🍽 {r.servings}</span>
                      <span>❤️ {r.likesCount || 0}</span>
                    </div>
                    {r.author && (
                      <div className={styles.rAuthor}>
                        <span className={styles.rAvPh}>{r.author.username?.[0]?.toUpperCase()}</span>
                        <span>{r.author.username}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{color:'var(--muted)',textAlign:'center',padding:'40px 0'}}>
              No recipes yet. <Link href="/auth/register">Be the first to share!</Link>
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container" style={{textAlign:'center'}}>
          <h2 style={{color:'#fff',marginBottom:12}}>Ready to share your recipe?</h2>
          <p style={{color:'rgba(255,255,255,.85)',marginBottom:32}}>Join thousands of home cooks sharing culinary creations every day.</p>
          <Link href="/auth/register" className="btn btn-lg" style={{background:'#fff',color:'var(--terracotta)'}}>Get Started Free</Link>
        </div>
      </section>
    </div>
  );
}