'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { recipesAPI, categoriesAPI, tagsAPI } from '@/lib/api';
import s from './create.module.css';
import { UploadButton } from '@uploadthing/react';

export default function CreateRecipePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [image, setImage] = useState('');
  const [form, setForm] = useState({ title:'', description:'', cookingTime:'', servings:'', difficulty:'easy', category:'', tags:[] });
  const [ings, setIngs] = useState([{ name:'', amount:'', unit:'' }]);
  const [steps, setSteps] = useState([{ step:1, text:'' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // перенаправление на страницу входа, если пользователь не авторизован
  useEffect(() => { if (!loading && !user) router.push('/auth/login'); }, [user, loading, router]);
  // загрузка категорий и тегов при монтировании
  useEffect(() => {
    Promise.all([categoriesAPI.getAll(), tagsAPI.getAll()])
      .then(([c,t]) => { setCats(c); setAllTags(t); }).catch(()=>{});
  }, []);

  const addIng = () => setIngs(p => [...p, { name:'', amount:'', unit:'' }]); // добавление ингредиента
  const rmIng = i => setIngs(p => p.filter((_,j)=>j!==i)); // удаление ингредиента
  const upIng = (i,f,v) => setIngs(p => p.map((x,j) => j===i?{...x,[f]:v}:x)); // обновление поля ингредиента
  const addStep = () => setSteps(p => [...p, { step:p.length+1, text:'' }]); // добавление шага
  const rmStep = i => setSteps(p => p.filter((_,j)=>j!==i).map((s,j)=>({...s,step:j+1}))); // удаление шага и перенумерация
  const upStep = (i,v) => setSteps(p => p.map((x,j) => j===i?{...x,text:v}:x)); // обновление текста шага
  const toggleTag = id => setForm(f => ({ ...f, tags: f.tags.includes(id)?f.tags.filter(t=>t!==id):[...f.tags,id] })); // добавление/удаление тега

  // обработчик отправки формы для создания нового рецепта
  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.title||!form.description||!form.cookingTime||!form.servings) return setError('Fill in all required fields');
    if (ings.some(i=>!i.name||!i.amount)) return setError('All ingredients need name and amount');
    if (steps.some(s=>!s.text)) return setError('All steps need text');
    setSaving(true);
    try {
      // создание рецепта через API и перенаправление на страницу нового рецепта
      const recipe = await recipesAPI.create({ ...form, cookingTime:+form.cookingTime, servings:+form.servings, ingredients:ings, instructions:steps, image });
      router.push(`/recipes/${recipe._id}`);
    } catch(err){ setError(err.message||'Failed to create recipe'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner"/>;
  if (!user) return null;

  return (
    <div className={s.page}>
      <div className="container" style={{maxWidth:820}}>
        <h1 className={s.heading}>✍️ New Recipe</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>

          <div className={s.card}>
            <h2>Basic Information</h2>
            <div className="form-group"><label>Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="E.g. Creamy Pasta Carbonara" required/></div>
            <div className="form-group"><label>Description *</label><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe your recipe…" required/></div>
            <div className={s.row3}>
              <div className="form-group"><label>Cook Time (min) *</label><input type="number" value={form.cookingTime} onChange={e=>setForm(f=>({...f,cookingTime:e.target.value}))} min={1} required/></div>
              <div className="form-group"><label>Servings *</label><input type="number" value={form.servings} onChange={e=>setForm(f=>({...f,servings:e.target.value}))} min={1} required/></div>
              <div className="form-group"><label>Difficulty *</label>
                <select value={form.difficulty} onChange={e=>setForm(f=>({...f,difficulty:e.target.value}))}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                <option value="">Select category</option>
                {cats.map(c=><option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Recipe Photo</label>
              {image ? (
                <div className={s.imgPrev}><img src={image} alt="preview"/><button type="button" className="btn btn-ghost btn-sm" onClick={()=>setImage('')}>Remove</button></div>
              ) : (
                <div className={s.uploadBox}>
                  <UploadButton
                    endpoint="recipeImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]?.url) setImage(res[0].url);
                    }}
                    onUploadError={(error) => alert(error.message)}
                  />
                </div>
              )}
            </div>
          </div>

          {allTags.length>0 && (
            <div className={s.card}><h2>Tags</h2>
              <div className={s.tagGrid}>
                {allTags.map(t=>(
                  <button key={t._id} type="button" className={`tag ${form.tags.includes(t._id)?s.tagSel:''}`}
                    onClick={()=>toggleTag(t._id)}
                    style={form.tags.includes(t._id)?{background:t.color,color:'#fff',borderColor:t.color}:{}}
                  >{t.name}</button>
                ))}
              </div>
            </div>
          )}

          <div className={s.card}><h2>Ingredients *</h2>
            {ings.map((ing,i)=>(
              <div key={i} className={s.ingRow}>
                <input placeholder="Amount" value={ing.amount} onChange={e=>upIng(i,'amount',e.target.value)} style={{width:90}}/>
                <input placeholder="Unit" value={ing.unit} onChange={e=>upIng(i,'unit',e.target.value)} style={{width:70}}/>
                <input placeholder="Ingredient name *" value={ing.name} onChange={e=>upIng(i,'name',e.target.value)} style={{flex:1}}/>
                {ings.length>1 && <button type="button" className={s.rmBtn} onClick={()=>rmIng(i)}>✕</button>}
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addIng}>+ Add Ingredient</button>
          </div>

          <div className={s.card}><h2>Instructions *</h2>
            {steps.map((st,i)=>(
              <div key={i} className={s.stepRow}>
                <span className={s.stepN}>{st.step}</span>
                <textarea rows={2} placeholder={`Step ${st.step}…`} value={st.text} onChange={e=>upStep(i,e.target.value)} style={{flex:1}}/>
                {steps.length>1 && <button type="button" className={s.rmBtn} onClick={()=>rmStep(i)}>✕</button>}
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addStep}>+ Add Step</button>
          </div>

          <div className={s.submit}>
            <button type="button" className="btn btn-ghost" onClick={()=>router.back()}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving?'Publishing…':'🚀 Publish Recipe'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
