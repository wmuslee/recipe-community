import { notFound } from 'next/navigation';
import Link from 'next/link';
import CommentSection from './CommentSection';
import s from './recipe.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function getRecipe(id) {
  try {
    const r = await fetch(`${API}/api/recipes/${id}`, { next: { revalidate: 0 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

export default async function RecipePage({ params }) {
  const recipe = await getRecipe(params.id);
  if (!recipe) notFound();

  return (
    <div className={s.page}>
      <div className="container">

        {/* Hero */}
        <div className={s.hero}>
          <div className={s.heroText}>
            {recipe.category && (
              <span className={s.catPill} style={{background:recipe.category.color+'22',color:recipe.category.color}}>
                {recipe.category.icon} {recipe.category.name}
              </span>
            )}
            <h1 className={s.title}>{recipe.title}</h1>
            <p className={s.desc}>{recipe.description}</p>

            <div className={s.meta}>
              <span>⏱ <b>{recipe.cookingTime}</b> min</span>
              <span>🍽 <b>{recipe.servings}</b> servings</span>
              <span>👁 <b>{recipe.viewsCount}</b> views</span>
              <span className={`badge badge-${recipe.difficulty}`}>{recipe.difficulty}</span>
            </div>

            {recipe.tags?.length > 0 && (
              <div className={s.tags}>
                {recipe.tags.map(t => <span key={t._id} className="tag" style={{borderColor:t.color}}>{t.name}</span>)}
              </div>
            )}

            {recipe.author && (
              <Link href={`/profile/${recipe.author._id}`} className={s.author}>
                <div className={s.avPh}>{recipe.author.username?.[0]?.toUpperCase()}</div>
                <div>
                  <p className={s.authorName}>{recipe.author.username}</p>
                  {recipe.author.bio && <p className={s.authorBio}>{recipe.author.bio}</p>}
                </div>
              </Link>
            )}
          </div>

          {recipe.image && (
            <div className={s.heroImg}>
              <img src={recipe.image} alt={recipe.title} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className={s.body}>
          <section className={s.box}>
            <h2>🥗 Ingredients</h2>
            <ul className={s.ingList}>
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className={s.ing}>
                  <span className={s.ingDot}/>
                  <span className={s.ingAmt}>{ing.amount} {ing.unit}</span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={s.box}>
            <h2>👨‍🍳 Instructions</h2>
            <ol className={s.steps}>
              {recipe.instructions?.map((step, i) => (
                <li key={i} className={s.step}>
                  <span className={s.stepN}>{step.step||i+1}</span>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Real-time comments — Client Component */}
        <CommentSection recipeId={recipe._id} authorId={recipe.author?._id} initialLikes={recipe.likesCount||0} />
      </div>
    </div>
  );
}
