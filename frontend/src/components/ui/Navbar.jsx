import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Cpu, LayoutDashboard, BarChart3, MessageSquare, 
  Plus, LogOut, Sun, Moon, Database, ChevronDown 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ 
  user, onLogout, activePage, accentColor = '#FFFFFF', 
  roleLabel, brandSuffix = ' Console', currentTheme, toggleTheme 
}) {
  const navigate = useNavigate();

  const NavItem = ({ to, icon: Icon, label, id }) => {
    const isActive = activePage === id;
    return (
      <Link 
        to={to} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', 
          borderRadius: '6px', textDecoration: 'none', transition: 'var(--transition-smooth)',
          background: isActive ? 'var(--color-bg-surface)' : 'transparent',
          color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontSize: '0.8rem', fontWeight: 600
        }}
      >
        <Icon size={14} />
        {label}
      </Link>
    );
  };

  return (
    <nav style={{ 
      height: '56px', background: 'var(--color-bg-elevated)', borderBottom: 'var(--border-thin)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
      position: 'sticky', top: 0, zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--color-text-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg-base)' }}>
            <Cpu size={16} />
          </div>
          <span className="heading-elite" style={{ fontSize: '1rem', letterSpacing: '-0.02em' }}>
            ApplianceIQ <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{brandSuffix}</span>
          </span>
        </Link>

        {user && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" id="dashboard" />
            <NavItem to="/analytics" icon={BarChart3} label="Analytics" id="analytics" />
            <NavItem to="/upload" icon={Plus} label="Ingest" id="upload" />
            <NavItem to="/chat" icon={MessageSquare} label="Chat" id="chat" />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleTheme} 
          style={{ background: 'transparent', border: 'var(--border-thin)', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          {currentTheme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: 'var(--border-thin)', paddingLeft: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{user.role}</div>
            </div>
            <button 
              onClick={onLogout} 
              style={{ background: 'transparent', border: 'var(--border-thin)', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', cursor: 'pointer' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" className="btn-elite-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Login</Link>
            <Link to="/signup" className="btn-elite" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
