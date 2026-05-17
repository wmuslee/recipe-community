'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { recipesAPI, categoriesAPI, tagsAPI } from '@/lib/api';
import s from './edit.module.css';
import { UploadButton } from '@uploadthing/react';

export default function EditRecipePage({ params }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = params;

  const [cats, setCats] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [image, setImage] = useState('');
  const [form, setForm] = useState(null);
  const [ings, setIngs] = useState([]);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/auth/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!id) return;
    Promise.all([recipesAPI.getOne(id), categoriesAPI.getAll(), tagsAPI.getAll()])
      .then(([recipe, c, t]) => {
        setCats(c); setAllTags(t);
        setImage(recipe.image || '');
        setIngs(recipe.ingredients?.length ? recipe.ingredients : [{ name:'', amount:'', unit:'' }]);
        setSteps(recipe.instructions?.length ? recipe.instructions : [{ step:1, text:'' }]);
        setForm({
          title: recipe.title, description: recipe.description,
          cookingTime: recipe.cookingTime, servings: recipe.servings,
          difficulty: recipe.difficulty, category: recipe.category?._id || '',
          tags: recipe.tags?.map(t=>t._id) || [],
        });
      }).catch(() => router.push('/recipes'));
  }, [id, router]);

  const addIng = () => setIngs(p => [...p, { name:'', amount:'', unit:'' }]);
  const rmIng = i => setIngs(p => p.filter((_,j)=>j!==i));
  const upIng = (i,f,v) => setIngs(p => p.map((x,j) => j===i?{...x,[f]:v}:x));
  const addStep = () => setSteps(p => [...p, { step:p.length+1, text:'' }]);
  const rmStep = i => setSteps(p => p.filter((_,j)=>j!==i).map((s,j)=>({...s,step:j+1})));
  const upStep = (i,v) => setSteps(p => p.map((x,j) => j===i?{...x,text:v}:x));
  const toggleTag = tid => setForm(f => ({ ...f, tags: f.tags.includes(tid)?f.tags.filter(x=>x!==tid):[...f.tags,tid] }));

  const onSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await recipesAPI.update(id, { ...form, cookingTime:+form.cookingTime, servings:+form.servings, ingredients:ings, instructions:steps, image });
      router.push(`/recipes/${id}`);
    } catch(err){ setError(err.message||'Failed to update'); }
    finally { setSaving(false); }
  };

  if (loading || !form) return <div className="spinner"/>;

  return (
    <div className={s.page}>
      <div className="container" style={{maxWidth:820}}>
        <h1 className={s.heading}>✏️ Edit Recipe</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className={s.card}>
            <h2>Basic Information</h2>
            <div className="form-group"><label>Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
            <div className="form-group"><label>Description *</label><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/></div>
            <div className={s.row3}>
              <div className="form-group"><label>Cook Time (min)</label><input type="number" value={form.cookingTime} onChange={e=>setForm(f=>({...f,cookingTime:e.target.value}))} min={1}/></div>
              <div className="form-group"><label>Servings</label><input type="number" value={form.servings} onChange={e=>setForm(f=>({...f,servings:e.target.value}))} min={1}/></div>
              <div className="form-group"><label>Difficulty</label>
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
              <UploadButton
                endpoint="recipeImage"
                onClientUploadComplete={(res) => {
                  if (res?.[0]?.url) setImage(res[0].url);
                }}
                onUploadError={(error) => alert(error.message)}
              />
              <p style={{fontSize:'.8rem', color:'var(--muted)', margin:'8px 0'}}>
                Or paste URL:
              </p>
              <input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://…"/>
              {image && (
                <img src={image} alt="preview" style={{marginTop:10, maxHeight:180, objectFit:'cover', borderRadius:'var(--r)', width:'100%'}}/>
              )}
            </div>
            {image && <img src={image} alt="preview" style={{maxHeight:180,objectFit:'cover',borderRadius:'var(--r)',marginBottom:12,width:'100%'}}/>}
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

          <div className={s.card}><h2>Ingredients</h2>
            {ings.map((ing,i)=>(
              <div key={i} className={s.ingRow}>
                <input placeholder="Amount" value={ing.amount} onChange={e=>upIng(i,'amount',e.target.value)} style={{width:90}}/>
                <input placeholder="Unit" value={ing.unit} onChange={e=>upIng(i,'unit',e.target.value)} style={{width:70}}/>
                <input placeholder="Name" value={ing.name} onChange={e=>upIng(i,'name',e.target.value)} style={{flex:1}}/>
                {ings.length>1 && <button type="button" className={s.rmBtn} onClick={()=>rmIng(i)}>✕</button>}
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addIng}>+ Add</button>
          </div>

          <div className={s.card}><h2>Instructions</h2>
            {steps.map((st,i)=>(
              <div key={i} className={s.stepRow}>
                <span className={s.stepN}>{st.step}</span>
                <textarea rows={2} value={st.text} onChange={e=>upStep(i,e.target.value)} style={{flex:1}}/>
                {steps.length>1 && <button type="button" className={s.rmBtn} onClick={()=>rmStep(i)}>✕</button>}
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addStep}>+ Add Step</button>
          </div>

          <div className={s.submit}>
            <button type="button" className="btn btn-ghost" onClick={()=>router.push(`/recipes/${id}`)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving?'Saving…':'💾 Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
