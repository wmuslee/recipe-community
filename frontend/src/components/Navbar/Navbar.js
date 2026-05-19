'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import s from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mob, setMob] = useState(false);
  const ref = useRef(null);

  // закрытие выпадающего меню при клике вне его
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // функция для определения активной ссылки в навигации
  const active = (href) => `${s.link} ${path === href ? s.linkActive : ''}`;

  // обработчик выхода из аккаунта, который вызывает функцию logout из контекста и перенаправляет на главную страницу
  const handleLogout = () => { logout(); setOpen(false); router.push('/'); };

  return (
    <nav className={s.nav}>
      <div className={s.inner}>
        <Link href="/" className={s.logo}>🍳 RecipeCommunity</Link>

        <ul className={`${s.links} ${mob ? s.linksOpen : ''}`}>
          <li><Link href="/recipes" className={active('/recipes')}>Recipes</Link></li>
          {user && <>
            <li><Link href="/recipes/create" className={active('/recipes/create')}>+ Add Recipe</Link></li>
            <li><Link href="/favorites" className={active('/favorites')}>Saved</Link></li>
          </>}
        </ul>

        <div className={s.actions}>
          {user ? (
            <div className={s.drop} ref={ref}>
              <button className={s.avatarBtn} onClick={() => setOpen(o => !o)} aria-label="Menu">
                {user.avatar
                  ? <img src={user.avatar} alt={user.username} width={36} height={36} style={{objectFit:'cover',width:'100%',height:'100%'}} />
                  : <div className={s.avPh}>{user.username?.[0]?.toUpperCase()}</div>
                }
              </button>
              {open && (
                <div className={s.menu}>
                  <Link href="/profile" className={s.mi} onClick={() => setOpen(false)}>👤 My Profile</Link>
                  <Link href="/favorites" className={s.mi} onClick={() => setOpen(false)}>🔖 Saved Recipes</Link>
                  <Link href="/recipes/create" className={s.mi} onClick={() => setOpen(false)}>✍️ New Recipe</Link>
                  <div className={s.sep}/>
                  <button className={`${s.mi} ${s.miDanger}`} onClick={handleLogout}>→ Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
          <button className={s.ham} onClick={() => setMob(o => !o)} aria-label="Menu">
            <span/><span/><span/>
          </button>
        </div>
      </div>
    </nav>
  );
}
