import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LockClosedIcon, SearchIcon, PlusIcon, ShieldIcon,
  CopyIcon, EditIcon, TrashIcon, EyeIcon, EyeOffIcon,
  SettingsIcon, LogOutIcon, GridIcon, KeyIcon,
  CheckCircleIcon, AlertCircleIcon,
  GlobeIcon, BriefcaseIcon, MonitorIcon, MailIcon, UserIcon,
  FilterIcon, XIcon, ExternalLinkIcon, TagIcon, LinkIcon, ClockIcon,
  ArrowLeftIcon, StarIcon,
} from '../components/Icons';

const API_URL = 'http://localhost:5000/api';

const CATEGORIES  = ['All', 'Work', 'Personal', 'Finance', 'Development', 'Shopping'];
const SORT_OPTIONS = [
  { value: 'name',     label: 'Name A–Z'     },
  { value: 'strength', label: 'Strength'     },
  { value: 'updated',  label: 'Last Updated' },
];

const STRENGTH_META = [
  null,
  { label: 'Critical', cls: 'pip-red',   sw: 'sw-weak'   },
  { label: 'Weak',     cls: 'pip-amber', sw: 'sw-fair'   },
  { label: 'Good',     cls: 'pip-blue',  sw: 'sw-good'   },
  { label: 'Strong',   cls: 'pip-green', sw: 'sw-strong' },
];

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function StrengthBadge({ level }) {
  const m = STRENGTH_META[level] || STRENGTH_META[1];
  return <span className={`strength-badge ${m.cls}`}>{m.label}</span>;
}

function CopyBtn({ value, label = '' }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      className={`icon-btn ${copied ? 'icon-btn-copied' : ''}`}
      onClick={handle}
      title={`Copy ${label}`}
    >
      {copied ? <CheckCircleIcon size={14} /> : <CopyIcon size={14} />}
    </button>
  );
}

function RevealField({ value }) {
  const [show, setShow] = useState(false);
  return (
    <div className="vp-reveal-row">
      <span className="vp-reveal-val">
        {show ? value : '•'.repeat(Math.min(value.length, 18))}
      </span>
      <button
        className="icon-btn"
        onClick={() => setShow(s => !s)}
        title={show ? 'Hide' : 'Show'}
      >
        {show ? <EyeOffIcon size={13} /> : <EyeIcon size={13} />}
      </button>
      <CopyBtn value={value} label="password" />
    </div>
  );
}

/* ─────────────────────────────────────────
   SIDEBAR  (shared with dashboard / add)
───────────────────────────────────────── */
function Sidebar({ user }) {
  const navigate = useNavigate();
  
  function handleLogout() {
    localStorage.removeItem('lockify_token');
    localStorage.removeItem('lockify_user');
    localStorage.removeItem('lockify_userId');
    localStorage.removeItem('lockify_email');
    navigate('/');
  }
  
  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-top">
        <Link to="/" className="db-logo">
          <div className="db-logo-icon"><LockClosedIcon size={16} /></div>
          <span className="db-logo-name">Lockify</span>
        </Link>
        <nav className="db-nav">
          <Link to="/dashboard"    className="db-nav-item"><GridIcon     size={17} /> Dashboard</Link>
          <Link to="/add-password" className="db-nav-item"><PlusIcon     size={17} /> Add Password</Link>
          <Link to="/passwords"    className="db-nav-item db-nav-active"><KeyIcon  size={17} /> All Passwords</Link>
          <Link to="/settings"     className="db-nav-item"><SettingsIcon size={17} /> Settings</Link>
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
        <button className="db-logout-btn" onClick={handleLogout} title="Sign out">
          <LogOutIcon size={16} />
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────
   DETAIL DRAWER
───────────────────────────────────────── */
function DetailDrawer({ item, onClose, onDelete, onToggleFav }) {
  if (!item) return null;
  const sm = STRENGTH_META[item.strength] || STRENGTH_META[1];

  return (
    <>
      <div className="vp-drawer-overlay" onClick={onClose} />
      <aside className="vp-drawer">
        <div className="vp-drawer-glow" />

        {/* Header */}
        <div className="vp-drawer-head">
          <div className={`vp-drawer-icon ${item.color}`}>
            <item.Icon size={22} />
          </div>
          <div className="vp-drawer-title-wrap">
            <h2 className="vp-drawer-title">{item.name}</h2>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="vp-drawer-url"
            >
              {item.url.replace('https://', '')}
              <ExternalLinkIcon size={11} />
            </a>
          </div>
          <button className="icon-btn vp-drawer-close" onClick={onClose} title="Close">
            <XIcon size={16} />
          </button>
        </div>

        {/* Strength */}
        <div className={`vp-drawer-strength-banner ${sm.sw}`}>
          <ShieldIcon size={14} />
          <span>{sm.label} password</span>
          <StrengthBadge level={item.strength} />
        </div>

        {/* Fields */}
        <div className="vp-drawer-fields">

          <div className="vp-field">
            <span className="vp-field-label">
              <UserIcon size={12} /> Username
            </span>
            <div className="vp-field-val-row">
              <span className="vp-field-val">{item.username}</span>
              <CopyBtn value={item.username} label="username" />
            </div>
          </div>

          <div className="vp-field">
            <span className="vp-field-label">
              <MailIcon size={12} /> Email
            </span>
            <div className="vp-field-val-row">
              <span className="vp-field-val">{item.email}</span>
              <CopyBtn value={item.email} label="email" />
            </div>
          </div>

          <div className="vp-field">
            <span className="vp-field-label">
              <LockClosedIcon size={12} /> Password
            </span>
            <RevealField value={item.password} />
          </div>

          <div className="vp-field">
            <span className="vp-field-label">
              <LinkIcon size={12} /> URL
            </span>
            <div className="vp-field-val-row">
              <span className="vp-field-val vp-field-mono">{item.url}</span>
              <CopyBtn value={item.url} label="URL" />
            </div>
          </div>

          <div className="vp-field">
            <span className="vp-field-label">
              <TagIcon size={12} /> Category
            </span>
            <span className="vp-field-val">{item.category}</span>
          </div>

          {item.tags?.length > 0 && (
            <div className="vp-field">
              <span className="vp-field-label">
                <TagIcon size={12} /> Tags
              </span>
              <div className="vp-tags">
                {item.tags.map(t => (
                  <span key={t} className="vp-tag">{t}</span>
                ))}
              </div>
            </div>
          )}

          {item.notes && (
            <div className="vp-field">
              <span className="vp-field-label">Notes</span>
              <p className="vp-notes">{item.notes}</p>
            </div>
          )}

          <div className="vp-meta-row">
            <span className="vp-meta">
              <ClockIcon size={11} /> Updated {item.lastUpdated}
            </span>
            <span className="vp-meta">
              <ClockIcon size={11} /> Added {item.createdAt}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="vp-drawer-actions">
          <button
            className={`vp-fav-btn ${item.favorite ? 'vp-fav-btn-on' : ''}`}
            onClick={() => onToggleFav(item.id)}
            title={item.favorite ? 'Remove from Quick Access' : 'Add to Quick Access'}
          >
            <StarIcon size={15} />
            {item.favorite ? 'Unfavorite' : 'Quick Access'}
          </button>
          <Link
            to={`/edit-password/${item.id}`}
            className="btn-primary vp-edit-btn"
          >
            <EditIcon size={15} /> Edit
          </Link>
          <button
            className="vp-delete-btn"
            onClick={() => onDelete(item.id)}
            title="Delete"
          >
            <TrashIcon size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────── */
function DeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null;
  return (
    <div className="vp-modal-overlay" onClick={onCancel}>
      <div className="vp-modal" onClick={e => e.stopPropagation()}>
        <div className="vp-modal-glow" />
        <div className="vp-modal-icon">
          <TrashIcon size={24} />
        </div>
        <h3 className="vp-modal-title">Delete Password?</h3>
        <p className="vp-modal-sub">
          This will permanently remove <strong>{item.name}</strong> from your vault. This action cannot be undone.
        </p>
        <div className="vp-modal-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="vp-modal-confirm" onClick={() => onConfirm(item.id)}>
            <TrashIcon size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function ViewPassword() {
  const navigate = useNavigate();
  const [vault, setVault] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('All');
  const [sortBy,      setSortBy]      = useState('name');
  const [selected,    setSelected]    = useState(null);
  const [deleteItem,  setDeleteItem]  = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [strengthFilter, setStrengthFilter] = useState('All');

  // Fetch data on mount
  useEffect(() => {
    const token = localStorage.getItem('lockify_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user
    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(err => console.error('Failed to fetch user:', err));

    // Fetch vault
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
            email: item.email,
            password: item.password,
            url: item.url,
            category: item.category || 'Personal',
            strength: item.strength || 3,
            Icon: GlobeIcon,
            color: item.strength >= 4 ? 'vi-green' : item.strength >= 3 ? 'vi-blue' : item.strength >= 2 ? 'vi-amber' : 'vi-red',
            favorite: item.favorite || false,
            tags: item.tags || [],
            notes: item.notes || '',
            lastUpdated: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recently',
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'
          })));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch vault:', err);
        setLoading(false);
      });
  }, [navigate]);

  async function toggleFavorite(id) {
    const token = localStorage.getItem('lockify_token');
    try {
      const response = await fetch(`${API_URL}/vault/${id}/favorite`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setVault(prev => prev.map(item => item.id === id ? {...item, favorite: !item.favorite} : item));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }

  async function vaultDelete(id) {
    const token = localStorage.getItem('lockify_token');
    try {
      const response = await fetch(`${API_URL}/vault/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setVault(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  /* ── Filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = vault.filter(item => {
      const q     = search.toLowerCase();
      const matchQ = !q
        || item.name.toLowerCase().includes(q)
        || item.username.toLowerCase().includes(q)
        || item.email.toLowerCase().includes(q)
        || item.url.toLowerCase().includes(q)
        || item.tags?.some(t => t.includes(q));
      const matchCat = category === 'All' || item.category === category;
      const matchStr = strengthFilter === 'All'
        || (strengthFilter === 'strong'   && item.strength === 4)
        || (strengthFilter === 'good'     && item.strength === 3)
        || (strengthFilter === 'weak'     && item.strength <= 2);
      return matchQ && matchCat && matchStr;
    });

    if (sortBy === 'name')     list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'strength') list = [...list].sort((a, b) => b.strength - a.strength);
    return list;
  }, [vault, search, category, sortBy, strengthFilter]);

  async function handleDelete(id) {
    await vaultDelete(id);
    setDeleteItem(null);
    if (selected?.id === id) setSelected(null);
  }

  /* Stats */
  const total    = vault.length;
  const strong   = vault.filter(p => p.strength === 4).length;
  const weak     = vault.filter(p => p.strength <= 2).length;
  const favCount = vault.filter(p => p.favorite).length;

  return (
    <div className="db-shell">
      <Sidebar user={user} />

      <main className="db-main">

        {/* Top bar */}
        <header className="db-topbar">
          <div className="db-search-wrap">
            <SearchIcon size={15} className="db-search-icon" />
            <input
              className="db-search"
              type="text"
              placeholder="Search by name, username, email, tag…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="vp-search-clear" onClick={() => setSearch('')} title="Clear">
                <XIcon size={13} />
              </button>
            )}
          </div>
          <div className="db-topbar-right">
            <button
              className={`icon-btn ${showFilters ? 'icon-btn-copied' : ''}`}
              onClick={() => setShowFilters(s => !s)}
              title="Filters"
            >
              <FilterIcon size={16} />
            </button>
            <Link to="/add-password" className="btn-primary db-add-btn">
              <PlusIcon size={15} /> Add New
            </Link>
          </div>
        </header>

        <div className="db-content">

          {/* Page heading */}
          <div className="db-page-head">
            <div>
              <h1 className="db-page-title">All Passwords</h1>
              <p className="db-page-sub">{total} saved passwords in your vault</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="vp-mini-stats">
            <div className="vp-mini-stat">
              <KeyIcon size={14} />
              <span className="vp-mini-val">{total}</span>
              <span className="vp-mini-label">Total</span>
            </div>
            <div className="vp-mini-stat vp-mini-success">
              <ShieldIcon size={14} />
              <span className="vp-mini-val">{strong}</span>
              <span className="vp-mini-label">Strong</span>
            </div>
            <div className="vp-mini-stat vp-mini-danger">
              <AlertCircleIcon size={14} />
              <span className="vp-mini-val">{weak}</span>
              <span className="vp-mini-label">Weak / Critical</span>
            </div>
          </div>

          {/* Filter bar */}
          <div className="vp-filter-bar">
            {/* Category pills */}
            <div className="db-filters" style={{ marginBottom: 0 }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`db-filter-btn ${category === c ? 'db-filter-active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Sort + strength (only when filter open) */}
            {showFilters && (
              <div className="vp-extra-filters">
                <div className="vp-filter-group">
                  <span className="vp-filter-label">Strength</span>
                  {['All', 'strong', 'good', 'weak'].map(s => (
                    <button
                      key={s}
                      className={`db-filter-btn ${strengthFilter === s ? 'db-filter-active' : ''}`}
                      onClick={() => setStrengthFilter(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="vp-filter-group">
                  <span className="vp-filter-label">Sort by</span>
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      className={`db-filter-btn ${sortBy === o.value ? 'db-filter-active' : ''}`}
                      onClick={() => setSortBy(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="db-results-row">
            <span className="db-results-count">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              {category !== 'All' && ` in ${category}`}
              {search && ` for "${search}"`}
            </span>
          </div>

          {/* ── PASSWORD LIST ── */}
          {filtered.length > 0 ? (
            <div className="vp-list">
              {/* List header */}
              <div className="vp-list-header">
                <div className="vp-list-col vp-col-name">Name</div>
                <div className="vp-list-col vp-col-user">Username</div>
                <div className="vp-list-col vp-col-pass">Password</div>
                <div className="vp-list-col vp-col-strength">Strength</div>
                <div className="vp-list-col vp-col-updated">Updated</div>
                <div className="vp-list-col vp-col-actions"></div>
              </div>

              {filtered.map(item => (
                <div
                  key={item.id}
                  className={`vp-list-row ${selected?.id === item.id ? 'vp-row-active' : ''} ${item.favorite ? 'vp-row-fav' : ''}`}
                  onClick={() => setSelected(item)}
                >
                  {/* Name + icon */}
                  <div className="vp-list-col vp-col-name">
                    <button
                      className={`vp-star-btn ${item.favorite ? 'vp-star-on' : ''}`}
                      onClick={e => { e.stopPropagation(); toggleFavorite(item.id); }}
                      title={item.favorite ? 'Unfavourite' : 'Favourite'}
                    >
                      <StarIcon size={13} />
                    </button>
                    <div className={`db-tbl-icon ${item.color}`}>
                      <item.Icon size={14} />
                    </div>
                    <div className="vp-name-stack">
                      <span className="vp-item-name">{item.name}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vp-item-url"
                        onClick={e => e.stopPropagation()}
                      >
                        {item.url.replace('https://', '')}
                        <ExternalLinkIcon size={10} />
                      </a>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="vp-list-col vp-col-user" onClick={e => e.stopPropagation()}>
                    <div className="vp-user-cell">
                      <span className="db-tbl-mono vp-truncate">{item.username}</span>
                      <CopyBtn value={item.username} label="username" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="vp-list-col vp-col-pass" onClick={e => e.stopPropagation()}>
                    <RevealField value={item.password} />
                  </div>

                  {/* Strength */}
                  <div className="vp-list-col vp-col-strength">
                    <StrengthBadge level={item.strength} />
                  </div>

                  {/* Updated */}
                  <div className="vp-list-col vp-col-updated">
                    <span className="vp-updated">
                      <ClockIcon size={11} /> {item.lastUpdated}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="vp-list-col vp-col-actions" onClick={e => e.stopPropagation()}>
                    <div className="db-tbl-actions">
                      <button className="icon-btn" title="View" onClick={() => setSelected(item)}>
                        <EditIcon size={14} />
                      </button>
                      <button className="icon-btn icon-btn-danger" title="Delete" onClick={() => setDeleteItem(item)}>
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="db-empty">
              <SearchIcon size={40} className="db-empty-icon" />
              <h3 className="db-empty-title">No passwords found</h3>
              <p className="db-empty-sub">Try adjusting your search or filters.</p>
              <Link to="/add-password" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
                <PlusIcon size={15} /> Add Your First Password
              </Link>
            </div>
          )}

        </div>
      </main>

      {/* ── DETAIL DRAWER ── */}
      <DetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onDelete={id => setDeleteItem(vault.find(p => p.id === id))}
        onToggleFav={toggleFavorite}
      />

      {/* ── DELETE MODAL ── */}
      <DeleteModal
        item={deleteItem}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}