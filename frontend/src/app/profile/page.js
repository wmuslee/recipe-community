'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI, recipesAPI } from '@/lib/api';
import s from './profile.module.css';
import { UploadButton } from '@uploadthing/react';

export default function ProfilePage() {
  const { user, loading, updateUser, logout } = useAuth();
  const router = useRouter();
  const [myRecipes, setMyRecipes] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username:'', bio:'', avatar:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // перенаправление на страницу входа, если пользователь не авторизован
  useEffect(() => { if (!loading && !user) router.push('/auth/login'); }, [user, loading, router]);
  useEffect(() => {
    if (user) {
      setForm({ username: user.username, bio: user.bio||'', avatar: user.avatar||'' });
      recipesAPI.byUser(user._id).then(setMyRecipes).catch(()=>{});
    }
  }, [user]);

  // сохранение изменений профиля
  const save = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const updated = await authAPI.updateProfile(form);
      updateUser(updated); setSuccess('Profile updated!'); setEditing(false);
      setTimeout(()=>setSuccess(''), 3000);
    } catch(err){ setError(err.message||'Failed'); }
    finally { setSaving(false); }
  };

  // удаление рецепта
  const delRecipe = async id => {
    if (!confirm('Delete this recipe?')) return;
    try { await recipesAPI.delete(id); setMyRecipes(p=>p.filter(r=>r._id!==id)); }
    catch(err){ alert(err.message); }
  };

  if (loading) return <div className="spinner"/>;
  if (!user) return null;

  return (
    <div className={s.page}>
      <div className="container">
        <div className={s.profileCard}>
          <div className={s.avWrap}>
            {user.avatar
              ? <img src={user.avatar} alt={user.username} className={s.av}/>
              : <div className={s.avPh}>{user.username?.[0]?.toUpperCase()}</div>
            }
          </div>

          {!editing ? (
            <div className={s.info}>
              <h1>{user.username}</h1>
              <p className={s.email}>{user.email}</p>
              {user.bio && <p className={s.bio}>{user.bio}</p>}
              <div className={s.stats}><div className={s.stat}><b>{myRecipes.length}</b><span>Recipes</span></div></div>
              <button className="btn btn-outline btn-sm" onClick={()=>setEditing(true)}>✏️ Edit Profile</button>
            </div>
          ) : (
            <form onSubmit={save} className={s.editForm}>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {/* Avatar upload — UploadThing type 2 */}
              <div className="form-group">
                <label>Avatar Photo URL</label>
                <UploadButton
                  endpoint="avatarImage"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.url) setForm(f => ({ ...f, avatar: res[0].url }));
                  }}
                  onUploadError={(error) => alert(error.message)}
                />
                {form.avatar && <img src={form.avatar} alt="preview" style={{width:80,height:80,objectFit:'cover',borderRadius:'50%',marginTop:8}}/>}
              </div>
              <div className="form-group"><label>Username</label><input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required/></div>
              <div className="form-group"><label>Bio</label><textarea rows={3} value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Tell the community about yourself…" maxLength={500}/></div>
              <div style={{display:'flex',gap:10}}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setEditing(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        <div className={s.section}>
          <div className={s.sHead}>
            <h2>My Recipes ({myRecipes.length})</h2>
            <Link href="/recipes/create" className="btn btn-primary btn-sm">+ New Recipe</Link>
          </div>
          {myRecipes.length===0 ? (
            <div className={s.empty}>
              <p>You haven&apos;t shared any recipes yet.</p>
              <Link href="/recipes/create" className="btn btn-primary">Create your first recipe</Link>
            </div>
          ) : (
            <div className="grid-recipes">
              {myRecipes.map(r=>(
                <div key={r._id} className={`card ${s.rCard}`}>
                  <div className={s.rImg}>
                    {r.image?<img src={r.image} alt={r.title}/>:<div className={s.rImgPh}>🍽️</div>}
                  </div>
                  <div className={s.rBody}>
                    <h3><Link href={`/recipes/${r._id}`}>{r.title}</Link></h3>
                    <p>{r.description}</p>
                    <div className={s.rActions}>
                      <Link href={`/recipes/${r._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                      <button className="btn btn-sm" style={{background:'#fee2e2',color:'#ef4444',border:'none'}} onClick={()=>delRecipe(r._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
