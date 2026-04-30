import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, LogOut, LayoutDashboard, Upload, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({
    user,
    onLogout,
    activePage = 'dashboard',
    accentColor = '#3B82F6',
    roleLabel = 'Business Owner',
    brandSuffix = '',
}) {
    const links = [
        { key: 'dashboard', to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
        { key: 'upload', to: '/upload', label: 'Upload Manual', icon: <Upload size={14} /> },
        { key: 'analytics', to: '/analytics', label: 'Insights', icon: <BarChart3 size={14} /> },
    ];

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <>
            <nav className="iq-navbar" id="main-navbar">
                <div className="iq-navbar-inner">
                    <Link to="/dashboard" className="iq-brand" style={{ textDecoration: 'none' }}>
                        <div className="iq-brand-icon" style={{ background: 'white' }}>
                            <Cpu size={18} color="black" />
                        </div>
                        <span className="iq-brand-text">
                            ApplianceIQ
                            {brandSuffix && <span className="iq-brand-suffix" style={{ color: accentColor }}>{brandSuffix}</span>}
                        </span>
                    </Link>

                    <div className="iq-nav-links">
                        {links.map((link) => (
                            <Link
                                key={link.key}
                                to={link.to}
                                className={`iq-nav-link ${activePage === link.key ? 'active' : ''}`}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {link.icon}
                                    {link.label}
                                </span>
                                {activePage === link.key && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="iq-nav-indicator"
                                        style={{ background: 'white' }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="iq-nav-user">
                        <div className="iq-user-meta">
                            <span className="iq-user-name">{user?.name}</span>
                            <span className="iq-user-role" style={{ color: 'var(--color-text-muted)' }}>{roleLabel}</span>
                        </div>
                        <div className="iq-avatar">
                            {initials}
                        </div>
                        <button onClick={onLogout} className="iq-btn-logout" title="Sign Out" id="logout-btn">
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </nav>

            <style>{`
                .iq-navbar {
                    background: #020408;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .iq-navbar-inner {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 40px;
                    height: 72px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .iq-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                }

                .iq-brand-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .iq-brand-text {
                    font-size: 1.1rem;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                }

                .iq-brand-suffix {
                    font-weight: 600;
                    font-size: 0.75rem;
                    margin-left: 8px;
                    opacity: 0.8;
                }

                .iq-nav-links {
                    display: flex;
                    gap: 8px;
                }

                .iq-nav-link {
                    color: #475569;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 0.8rem;
                    padding: 8px 20px;
                    border-radius: 6px;
                    position: relative;
                    transition: all 0.2s;
                }

                .iq-nav-link:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.03);
                }

                .iq-nav-link.active {
                    color: white;
                }

                .iq-nav-indicator {
                    position: absolute;
                    bottom: -1px;
                    left: 20px;
                    right: 20px;
                    height: 2px;
                    border-radius: 2px;
                }

                .iq-nav-user {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .iq-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    background: #0D1117;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: white;
                }

                .iq-user-meta {
                    display: flex;
                    flex-direction: column;
                    text-align: right;
                }

                .iq-user-name {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: white;
                    line-height: 1.2;
                }

                .iq-user-role {
                    font-size: 0.6rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .iq-btn-logout {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #475569;
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .iq-btn-logout:hover {
                    color: #EF4444;
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.2);
                }

                @media (max-width: 768px) {
                    .iq-navbar-inner { padding: 0 16px; }
                    .iq-user-meta { display: none; }
                }
            `}</style>
        </>
    );
}
