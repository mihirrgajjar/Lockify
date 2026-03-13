import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LockClosedIcon, SearchIcon, PlusIcon, ShieldIcon,
  BellIcon, SettingsIcon, LogOutIcon, GridIcon, ListIcon,
  KeyIcon, AlertCircleIcon, CheckCircleIcon,
  GlobeIcon, BriefcaseIcon, MonitorIcon, MailIcon, UserIcon,
  EyeIcon, EyeOffIcon, CopyIcon, TrashIcon, EditIcon,
} from '../components/Icons';

const API_URL = 'http://localhost:5000/api';

/* ─── VAULT DATA ─── */
const INITIAL_VAULT = []; // Start empty - will fetch from backend

const CATEGORIES   = ['All','Work','Personal','Finance','Development','Shopping'];
const STRENGTH_LBL = ['','Critical','Weak','Good','Strong'];
const STRENGTH_CLS = ['','pip-red','pip-amber','pip-blue','pip-green'];
// Stats will be loaded from backend

const COLOR_MAP = {
  'vi-green':  { bg:'rgba(52,211,153,0.15)',  fg:'#34d399' },
  'vi-blue':   { bg:'rgba(94,129,244,0.15)',  fg:'#5e81f4' },
  'vi-amber':  { bg:'rgba(251,191,36,0.15)',  fg:'#fbbf24' },
  'vi-red':    { bg:'rgba(248,113,113,0.15)', fg:'#f87171' },
  'vi-purple': { bg:'rgba(167,139,250,0.15)', fg:'#a78bfa' },
};

function StrBadge({ level }) {
  return <span className={`strength-badge ${STRENGTH_CLS[level]||'pip-red'}`}>{STRENGTH_LBL[level]||'Critical'}</span>;
}

/* ─── INLINE SVG ICONS (hardcoded colors, always visible) ─── */
function IcoStar({ filled }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={filled ? '#fbbf24' : 'none'}
        stroke={filled ? '#fbbf24' : '#94a3b8'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IcoCopy({ done }) {
  if (done) return (
    <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polyline points="20 6 9 17 4 12" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IcoEdit() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IcoTrash() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polyline points="3 6 5 6 21 6" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 11v6M14 11v6" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── VAULT CARD ─── */
function VaultCard({ item, onFav, onDelete }) {
  const [copied, setCopied] = useState(false);
  const ic = COLOR_MAP[item.color] || COLOR_MAP['vi-blue'];

  function copyUser(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(item.username).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 1800);
  }

  return (
    <div className={`vault-card ${item.favorite ? 'vault-card-fav' : ''}`}>
      {/* Accent top line */}
      <div className="vault-card-accent" style={{ background: `linear-gradient(90deg,transparent,${item.favorite ? '#fbbf24' : ic.fg},transparent)` }} />

      {/* Site icon + name */}
      <div className="vault-card-header">
        <div className="vault-card-site-icon" style={{ background: ic.bg, color: ic.fg }}>
          <item.Icon size={20} />
        </div>
        <div className="vault-card-title-wrap">
          <div className="vault-card-name">{item.name}</div>
          <div className="vault-card-username">{item.username}</div>
        </div>
      </div>

      {/* URL */}
      <div className="vault-card-url">{item.url}</div>

      {/* 4 action buttons */}
      <div className="vault-card-actions">

        {/* ⭐ Star / Quick Access */}
        <button
          className={`vca-btn vca-star ${item.favorite ? 'vca-star-on' : ''}`}
          onClick={() => onFav(item.id)}
          title={item.favorite ? 'Remove from Quick Access' : 'Add to Quick Access'}
        >
          <span className="vca-icon"><IcoStar filled={item.favorite} /></span>
          <span className="vca-label">{item.favorite ? 'Pinned' : 'Pin'}</span>
        </button>

        {/* 📋 Copy Username */}
        <button
          className={`vca-btn vca-copy ${copied ? 'vca-copy-done' : ''}`}
          onClick={copyUser}
          title="Copy Username"
        >
          <span className="vca-icon"><IcoCopy done={copied} /></span>
          <span className="vca-label">{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        {/* ✏️ Edit */}
        <Link
          to={`/edit-password/${item.id}`}
          className="vca-btn vca-edit"
          title="Edit Password"
          style={{ textDecoration: 'none' }}
        >
          <span className="vca-icon"><IcoEdit /></span>
          <span className="vca-label">Edit</span>
        </Link>

        {/* 🗑️ Delete */}
        <button
          className="vca-btn vca-delete"
          onClick={() => onDelete(item.id)}
          title="Delete Password"
        >
          <span className="vca-icon"><IcoTrash /></span>
          <span className="vca-label">Delete</span>
        </button>

      </div>

      {/* Footer */}
      <div className="vault-card-footer">
        <span className="vault-card-cat">{item.category}</span>
        <StrBadge level={item.strength} />
      </div>
    </div>
  );
}

/* ─── QUICK ACCESS CARD ─── */
function QuickCard({ item, onUnstar }) {
  const [copied, setCopied] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const ic = COLOR_MAP[item.color] || COLOR_MAP['vi-blue'];

  function copy(val, type, e) {
    e.stopPropagation();
    navigator.clipboard.writeText(val).catch(()=>{});
    setCopied(type); setTimeout(()=>setCopied(null), 1800);
  }

  return (
    <div className="qc-card-themed" style={{ position:'relative', borderRadius:16, padding:16, display:'flex', flexDirection:'column', gap:10, overflow:'hidden', minWidth:0 }}>
      <button onClick={e=>{e.stopPropagation();onUnstar(item.id);}} title="Remove from Quick Access"
        style={{ position:'absolute', top:12, right:12, width:26, height:26, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.45)', cursor:'pointer', color:'#fbbf24' }}>
        <IcoStar filled={true}/>
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:10, paddingRight:30 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:ic.bg, color:ic.fg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <item.Icon size={18}/>
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--c-text1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ fontSize:'0.68rem', color:'var(--c-text3)', fontFamily:'monospace', textDecoration:'none' }}>{item.url.replace('https://','')}</a>
        </div>
      </div>
      {[['Username', item.username, 'user'], ['Password', item.password, 'pw']].map(([label, val, key]) => (
        <div key={key}>
          <div style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--c-text3)', marginBottom:3 }}>{label}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, background:'var(--c-bg2)', border:'1px solid var(--c-border)', borderRadius:7, padding:'5px 8px' }}>
            <span style={{ fontSize:'0.76rem', color:'var(--c-text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontFamily: key==='pw'?'monospace':'inherit', letterSpacing: key==='pw'?'0.1em':'normal', textTransform: 'none' }}>
              {key==='pw' ? (showPassword ? val : '•'.repeat(Math.min(val.length, 10))) : val}
            </span>
            {key==='pw' && (
              <button 
                onClick={e=>{e.stopPropagation(); setShowPassword(!showPassword);}}
                style={{ padding:'2px 6px', fontSize:'0.6rem', background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:4, cursor:'pointer', color:'var(--c-text3)' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            )}
            <button onClick={e=>copy(val,key,e)}
              style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'3px 8px', borderRadius:5, border: copied===key?'1px solid rgba(52,211,153,0.4)':'1px solid var(--c-border2)', background: copied===key?'rgba(52,211,153,0.08)':'var(--c-primary-lt)', color: copied===key?'#34d399':'var(--c-primary)', fontSize:'0.68rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
              {copied===key ? <><IcoCopy done={true}/> Copied!</> : <><IcoCopy done={false}/> Copy</>}
            </button>
          </div>
        </div>
      ))}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid var(--c-border)' }}>
        <StrBadge level={item.strength}/>
        <span style={{ fontSize:'0.65rem', fontWeight:600, textTransform:'uppercase', color:'var(--c-text3)' }}>{item.category}</span>
      </div>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [vault,    setVault]    = useState(INITIAL_VAULT);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [view,     setView]     = useState('grid');
  const [sideOpen, setSideOpen] = useState(false);
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState({
    total: 0,
    securityScore: 100,
    weak: 0,
    breached: 0
  });

  // Fetch user data and vault items on mount
  useEffect(() => {
    const token = localStorage.getItem('lockify_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user profile
    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(err => console.error('Failed to fetch user:', err));

    // Fetch vault items
    fetch(`${API_URL}/vault`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setVault(data.items.map(item => ({
            id: item._id,
            name: item.name,
            username: item.username,
            password: item.password,
            url: item.url,
            category: item.category || 'Personal',
            strength: item.strength || 3,
            Icon: GlobeIcon,
            color: item.strength >= 4 ? 'vi-green' : item.strength >= 3 ? 'vi-blue' : item.strength >= 2 ? 'vi-amber' : 'vi-red',
            favorite: item.favorite || false
          })));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch vault:', err);
        setLoading(false);
      });

    // Fetch stats
    fetch(`${API_URL}/vault/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats({
          total: data.total || 0,
          securityScore: data.score || 100,
          weak: data.weak || 0,
          breached: 0 // Not tracked yet
        });
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, [navigate]);

  const favorites = vault.filter(v => v.favorite);

  async function toggleFav(id) {
    const token = localStorage.getItem('lockify_token');
    try {
      const response = await fetch(`${API_URL}/vault/${id}/favorite`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setVault(p => p.map(it => it.id===id ? {...it,favorite:!it.favorite} : it));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }

  async function deleteItem(id) {
    const token = localStorage.getItem('lockify_token');
    try {
      const response = await fetch(`${API_URL}/vault/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setVault(p => p.filter(it => it.id!==id));
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  }

  function handleLogout() {
    localStorage.removeItem('lockify_token');
    localStorage.removeItem('lockify_user');
    localStorage.removeItem('lockify_userId');
    localStorage.removeItem('lockify_email');
    navigate('/');
  }

  const filtered = vault.filter(item => {
    const matchCat = category==='All' || item.category===category;
    const q = search.toLowerCase();
    return matchCat && (!q || item.name.toLowerCase().includes(q) || item.username.toLowerCase().includes(q) || item.url.toLowerCase().includes(q));
  });

  return (
    <div className="db-shell">
      <aside className={`db-sidebar ${sideOpen?'db-sidebar-open':''}`}>
        <div className="db-sidebar-top">
          <Link to="/" className="db-logo">
            <div className="db-logo-icon"><LockClosedIcon size={16}/></div>
            <span className="db-logo-name">Lockify</span>
          </Link>
          <nav className="db-nav">
            <Link to="/dashboard"    className="db-nav-item db-nav-active"><GridIcon size={17}/> Dashboard</Link>
            <Link to="/add-password" className="db-nav-item"><PlusIcon size={17}/> Add Password</Link>
            <Link to="/passwords"    className="db-nav-item"><KeyIcon size={17}/> All Passwords</Link>
            <Link to="/settings"     className="db-nav-item"><SettingsIcon size={17}/> Settings</Link>
          </nav>
        </div>
        <div className="db-sidebar-bottom">
          <div className="db-user">
            <div className="db-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div className="db-user-info">
              <span className="db-user-name">{user?.name || 'User'}</span>
              <span className="db-user-email">{user?.email || 'No email'}</span>
            </div>
          </div>
          <button className="db-logout-btn" onClick={handleLogout}><LogOutIcon size={16}/></button>
        </div>
      </aside>
      {sideOpen && <div className="db-overlay" onClick={()=>setSideOpen(false)}/>}

      <main className="db-main">
        <header className="db-topbar">
          <button className="db-hamburger" onClick={()=>setSideOpen(s=>!s)}><span/><span/><span/></button>
          <div className="db-search-wrap">
            <SearchIcon size={15} className="db-search-icon"/>
            <input className="db-search" type="text" placeholder="Search passwords, usernames, URLs…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="db-topbar-right">
            <button className="icon-btn"><BellIcon size={17}/></button>
            <Link to="/add-password" className="btn-primary db-add-btn"><PlusIcon size={15}/> Add New</Link>
          </div>
        </header>

        <div className="db-content">
          <div className="db-page-head">
            <div>
              <h1 className="db-page-title">Dashboard</h1>
              <p style={{fontSize:'0.82rem',color:'var(--c-text3)',marginTop:2}}>
                            {user ? `Welcome back, ${user.name}. Your vault is secure.` : 'Welcome to your vault. Start adding passwords.'}
                          </p>
            </div>
            <div className="db-view-toggle">
              <button className={`view-btn ${view==='grid'?'view-btn-active':''}`} onClick={()=>setView('grid')}><GridIcon size={15}/></button>
              <button className={`view-btn ${view==='list'?'view-btn-active':''}`} onClick={()=>setView('list')}><ListIcon size={15}/></button>
            </div>
          </div>

          {/* Stats */}
          <div className="db-stats">
            <div className="db-stat-card stat-blue">
              <div className="db-stat-icon"><KeyIcon size={18}/></div>
              <div className="db-stat-body">
                <span className="db-stat-value">{stats.total}</span>
                <span className="db-stat-label">Total Passwords</span>
                <span className="db-stat-sub">{stats.total === 0 ? 'Add your first password' : 'Passwords stored'}</span>
              </div>
            </div>
            <div className="db-stat-card stat-green">
              <div className="db-stat-icon"><ShieldIcon size={18}/></div>
              <div className="db-stat-body">
                <span className="db-stat-value">{stats.securityScore}%</span>
                <span className="db-stat-label">Security Score</span>
                <span className="db-stat-sub">{stats.weak > 0 ? `${stats.weak} need attention` : 'All good'}</span>
              </div>
            </div>
            <div className="db-stat-card stat-amber">
              <div className="db-stat-icon"><AlertCircleIcon size={18}/></div>
              <div className="db-stat-body">
                <span className="db-stat-value">{stats.weak}</span>
                <span className="db-stat-label">Weak Passwords</span>
                <span className="db-stat-sub">{stats.weak > 0 ? 'Update these' : 'All strong'}</span>
              </div>
            </div>
            <div className="db-stat-card stat-success">
              <div className="db-stat-icon"><CheckCircleIcon size={18}/></div>
              <div className="db-stat-body">
                <span className="db-stat-value">{stats.breached}</span>
                <span className="db-stat-label">Breach Alerts</span>
                <span className="db-stat-sub">{stats.breached === 0 ? 'All clear' : 'Take action'}</span>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          {favorites.length > 0 && (
            <section className="qc-section">
              <div className="qc-section-head">
                <div className="qc-section-title">
                  <span className="qc-title-star"><IcoStar filled={true}/></span>
                  Quick Access
                  <span className="qc-badge">{favorites.length}</span>
                </div>
                <Link to="/passwords" className="qc-view-all">View all -&gt;</Link>
              </div>
              <div className="qc-grid">
                {favorites.map(item=><QuickCard key={item.id} item={item} onUnstar={toggleFav}/>)}
              </div>
            </section>
          )}

          {favorites.length===0 && !search && (
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',background:'rgba(251,191,36,0.05)',border:'1px dashed rgba(251,191,36,0.2)',borderRadius:10,fontSize:'0.82rem',color:'var(--c-text3)',marginBottom:20}}>
              <IcoStar filled={false}/> Star any password below to pin it here for one-click copy.
            </div>
          )}

          {/* Filters */}
          <div className="db-filters">
            {CATEGORIES.map(c=>(
              <button key={c} className={`db-filter-btn ${category===c?'db-filter-active':''}`} onClick={()=>setCategory(c)}>{c}</button>
            ))}
          </div>

          <div style={{marginBottom:12,fontSize:'0.78rem',color:'var(--c-text3)'}}>
            {filtered.length} items{category!=='All'?` in ${category}`:''}
          </div>

          {/* Grid */}
          {view==='grid' && (
            <div className="vault-grid">
              {filtered.map(item=>(
                <VaultCard key={item.id} item={item} onFav={toggleFav} onDelete={deleteItem}/>
              ))}
              <Link to="/add-password" className="vault-add-card">
                <div className="vault-add-icon"><PlusIcon size={22}/></div>
                <span>Add Password</span>
              </Link>
            </div>
          )}

          {/* List */}
          {view==='list' && (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr><th style={{width:36}}></th><th>Name</th><th>Username</th><th>URL</th><th>Strength</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(item=>(
                    <tr key={item.id}>
                      <td>
                        <button onClick={()=>toggleFav(item.id)} title={item.favorite?'Unpin':'Pin'} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <IcoStar filled={item.favorite}/>
                        </button>
                      </td>
                      <td><div className="db-tbl-name"><div className={`db-tbl-icon ${item.color}`}><item.Icon size={14}/></div><div><span className="db-tbl-title">{item.name}</span><span className="db-tbl-cat">{item.category}</span></div></div></td>
                      <td><span className="db-tbl-mono">{item.username}</span></td>
                      <td><span className="db-tbl-url">{item.url}</span></td>
                      <td><StrBadge level={item.strength}/></td>
                      <td><div style={{display:'flex',gap:4}}>
                        <button onClick={()=>deleteItem(item.id)} title="Delete" style={{background:'none',border:'none',cursor:'pointer',padding:3,display:'flex',alignItems:'center'}}><IcoTrash/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length===0 && (
            <div className="db-empty">
              <SearchIcon size={40} className="db-empty-icon"/>
              <h3 className="db-empty-title">No results found</h3>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
