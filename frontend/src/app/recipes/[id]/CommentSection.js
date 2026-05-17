'use client';
import { useState, useEffect, useCallback } from 'react';
import { commentsAPI, recipesAPI } from '@/lib/api';
import { useRecipeWS } from '@/lib/ws';
import { useAuth } from '@/context/AuthContext';
import s from './comments.module.css';

export default function CommentSection({ recipeId, authorId, initialLikes }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [online, setOnline] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [saved, setSaved] = useState(false);

  const onCommentAdded = useCallback(c => {
    setComments(prev => prev.some(x => x._id === c._id) ? prev : [c, ...prev]);
  }, []);
  const onCommentDeleted = useCallback(id => setComments(prev => prev.filter(c => c._id !== id)), []);
  const onOnlineUsers = useCallback((users, count) => { setOnline(users); setOnlineCount(count); }, []);

  const { broadcastNewComment, broadcastDeleteComment } = useRecipeWS({
    recipeId, onCommentAdded, onCommentDeleted, onOnlineUsers,
  });

  useEffect(() => {
    commentsAPI.getByRecipe(recipeId).then(setComments).catch(() => {}).finally(() => setLoading(false));
  }, [recipeId]);

  const submit = async e => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await commentsAPI.create(recipeId, { text });
      setComments(prev => [c, ...prev]);
      broadcastNewComment(c);
      setText('');
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const del = async id => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(id);
      setComments(prev => prev.filter(c => c._id !== id));
      broadcastDeleteComment(id);
    } catch (err) { alert(err.message); }
  };

  const saveEdit = async id => {
    if (!editText.trim()) return;
    try {
      const updated = await commentsAPI.update(id, { text: editText });
      setComments(prev => prev.map(c => c._id === id ? updated : c));
      setEditId(null);
    } catch (err) { alert(err.message); }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const d = await recipesAPI.like(recipeId);
      setLiked(d.isLiked); setLikes(d.likesCount);
    } catch {}
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const d = await recipesAPI.save(recipeId);
      setSaved(d.isSaved);
    } catch {}
  };

  const likeComment = async id => {
    if (!user) return;
    try {
      const d = await commentsAPI.like(id);
      setComments(prev => prev.map(c => c._id === id
        ? { ...c, likes: d.isLiked ? [...(c.likes||[]), user._id] : (c.likes||[]).filter(x => x !== user._id) }
        : c
      ));
    } catch {}
  };

  return (
    <div className={s.wrap}>
      {/* Online users bar */}
      <div className={s.onlineBar}>
        <span className={s.dot}/>
        <span className={s.onlineText}>
          {onlineCount > 0 ? `${onlineCount} ${onlineCount===1?'person':'people'} viewing now` : 'Viewing now…'}
        </span>
        {online.length > 0 && (
          <div className={s.avGroup}>
            {online.slice(0,5).map(u => (
              <div key={u._id} className={s.avItem} title={u.username}>
                {u.avatar ? <img src={u.avatar} alt={u.username} width={24} height={24}/> : u.username?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Like + Save buttons */}
      <div style={{display:'flex', gap:12, marginBottom:28}}>
        <button className={`${s.likeBtn} ${liked?s.liked:''}`} onClick={handleLike} disabled={!user}>
          {liked ? '❤️' : '🤍'} {likes} likes
        </button>
        <button className={`${s.likeBtn} ${saved?s.liked:''}`} onClick={handleSave} disabled={!user}>
          {saved ? '🔖 Saved' : '🔖 Save'}
        </button>
      </div>

      <h2 className={s.title}>💬 Comments ({comments.length})</h2>

      {user ? (
        <form onSubmit={submit} className={s.form}>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share your thoughts…" rows={3} maxLength={1000}/>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting||!text.trim()}>
            {submitting?'Posting…':'Post Comment'}
          </button>
        </form>
      ) : (
        <div className={s.loginHint}><a href="/auth/login">Sign in</a> to leave a comment</div>
      )}

      {loading ? <div className="spinner"/> : comments.length === 0 ? (
        <p className={s.empty}>No comments yet — be the first! 🍴</p>
      ) : (
        <div className={s.list}>
          {comments.map(c => {
            const own = user && c.author?._id === user._id;
            const editing = editId === c._id;
            return (
              <div key={c._id} className={`${s.comment} fade-up`}>
                <div className={s.cAv}>
                  {c.author?.avatar ? <img src={c.author.avatar} alt={c.author.username}/> : c.author?.username?.[0]?.toUpperCase()}
                </div>
                <div className={s.cBody}>
                  <div className={s.cHead}>
                    <span className={s.cName}>{c.author?.username}</span>
                    <span className={s.cDate}>{new Date(c.createdAt).toLocaleDateString()}</span>
                    {c.isEdited && <span className={s.edited}>(edited)</span>}
                  </div>
                  {editing ? (
                    <div className={s.editForm}>
                      <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2}/>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn btn-primary btn-sm" onClick={()=>saveEdit(c._id)}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : <p className={s.cText}>{c.text}</p>}
                  <div className={s.cActions}>
                    <button className={s.ca} onClick={()=>likeComment(c._id)} disabled={!user}>♥ {c.likes?.length||0}</button>
                    {own && !editing && <>
                      <button className={s.ca} onClick={()=>{setEditId(c._id);setEditText(c.text);}}>Edit</button>
                      <button className={`${s.ca} ${s.danger}`} onClick={()=>del(c._id)}>Delete</button>
                    </>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
