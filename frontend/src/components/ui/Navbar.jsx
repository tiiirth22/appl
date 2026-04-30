import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, LayoutDashboard, Upload, Activity, MessageSquare, LogOut, Moon, Sun } from 'lucide-react';

export default function Navbar({ 
  user, 
  onLogout, 
  activePage, 
  accentColor = "var(--color-accent)", 
  roleLabel = "", 
  brandSuffix = "",
  currentTheme,
  toggleTheme 
}) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Console', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { id: 'upload', label: 'Ingest', icon: <Upload size={18} />, path: '/upload' },
    { id: 'analytics', label: 'Intelligence', icon: <Activity size={18} />, path: '/analytics' },
    { id: 'chat', label: 'Diagnostic', icon: <MessageSquare size={18} />, path: '/chat' },
  ];

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <nav style={{ 
      background: 'var(--color-bg-base)', 
      borderBottom: 'var(--border-thin)', 
      padding: '0 40px', 
      height: '80px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(20px)',
      transition: 'var(--transition-smooth)'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'var(--color-text-primary)', 
            borderRadius: '4px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'var(--color-bg-base)',
            transition: 'var(--transition-smooth)'
          }}>
            <Cpu size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontWeight: 800, 
              fontSize: '1rem', 
              color: 'var(--color-text-primary)', 
              letterSpacing: '-0.02em',
              transition: 'var(--transition-smooth)'
            }}>ApplianceIQ{brandSuffix}</span>
            {roleLabel && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{roleLabel}</span>}
          </div>
        </Link>

        {/* Nav Links */}
        {user && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
            {navItems.map((item) => (
              <Link 
                key={item.id} 
                to={item.path} 
                style={{ 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: activePage === item.id ? 'var(--color-text-primary)' : 'var(--color-text-dim)',
                  background: activePage === item.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'var(--border-thin)',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
            transition: 'var(--transition-smooth)'
          }}
          title={currentTheme === 'dark' ? 'Switch to Ivory Mode' : 'Switch to Obsidian Mode'}
        >
          {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', fontWeight: 800 }}>{user.role}</div>
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#EF4444', 
                border: 'none', 
                padding: '10px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'var(--transition-smooth)'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" className="btn-elite-ghost" style={{ padding: '8px 20px', fontSize: '0.75rem' }}>Login</Link>
            <Link to="/signup" className="btn-elite" style={{ padding: '8px 20px', fontSize: '0.75rem' }}>Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
