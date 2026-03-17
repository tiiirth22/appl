import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';

/**
 * Shared Navbar for all authenticated pages.
 * 
 * Props:
 *  - user: { name, picture }
 *  - onLogout: () => void
 *  - activePage: 'dashboard' | 'upload' | 'analytics'
 *  - accentColor: string (default '#3b82f6')
 *  - roleLabel: string (default 'Business Owner')
 *  - brandSuffix: string (optional, e.g. 'Console' for admin)
 */
export default function Navbar({
    user,
    onLogout,
    activePage = 'dashboard',
    accentColor = '#3b82f6',
    roleLabel = 'Business Owner',
    brandSuffix = '',
}) {
    const links = [
        { key: 'dashboard', to: '/dashboard', label: 'Dashboard' },
        { key: 'upload', to: '/upload', label: 'Upload' },
        { key: 'analytics', to: '/analytics', label: 'Insights' },
    ];

    return (
        <>
            <nav className="shared-navbar">
                <div className="shared-navbar-content">
                    <div className="shared-brand-group">
                        <Shield className="shared-brand-icon" size={24} style={{ color: accentColor }} />
                        <h2 className="shared-navbar-brand">
                            ApplianceIQ
                            {brandSuffix && <span className="shared-brand-suffix" style={{ color: accentColor }}>{brandSuffix}</span>}
                        </h2>
                    </div>

                    <div className="shared-navbar-links">
                        {links.map((link) => (
                            <Link
                                key={link.key}
                                to={link.to}
                                className={`shared-navbar-link ${activePage === link.key ? 'active' : ''}`}
                                style={activePage === link.key ? { '--active-color': accentColor } : {}}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="shared-navbar-user">
                        <div className="shared-user-profile">
                            <img
                                src={user?.picture || 'https://via.placeholder.com/40'}
                                alt={user?.name || 'User'}
                            />
                            <div className="shared-user-text">
                                <span className="shared-user-name">{user?.name}</span>
                                <span className="shared-user-role" style={{ color: accentColor }}>{roleLabel}</span>
                            </div>
                        </div>
                        <button onClick={onLogout} className="shared-btn-logout" title="Sign Out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            <style>{`
        .shared-navbar {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.75rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .shared-navbar-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .shared-brand-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .shared-navbar-brand {
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          margin: 0;
          color: white;
        }

        .shared-brand-suffix {
          font-weight: 500;
          font-size: 0.875rem;
          opacity: 0.8;
          margin-left: 0.5rem;
        }

        .shared-navbar-links {
          display: flex;
          gap: 2.5rem;
        }

        .shared-navbar-link {
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: color 0.2s;
          position: relative;
        }

        .shared-navbar-link:hover,
        .shared-navbar-link.active {
          color: white;
        }

        .shared-navbar-link.active::after {
          content: '';
          position: absolute;
          bottom: -22px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--active-color, #3b82f6);
          box-shadow: 0 0 10px var(--active-color, #3b82f6);
        }

        .shared-navbar-user {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .shared-user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .shared-user-profile img {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.1);
        }

        .shared-user-text {
          display: flex;
          flex-direction: column;
        }

        .shared-user-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: white;
        }

        .shared-user-role {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .shared-btn-logout {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #64748b;
          padding: 0.5rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .shared-btn-logout:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 768px) {
          .shared-navbar-content {
            flex-direction: column;
            gap: 0.75rem;
          }

          .shared-navbar-links {
            gap: 1.5rem;
          }

          .shared-user-text {
            display: none;
          }
        }
      `}</style>
        </>
    );
}
