import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, LogOut } from 'lucide-react';
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
        { key: 'dashboard', to: '/dashboard', label: 'Dashboard' },
        { key: 'upload', to: '/upload', label: 'Upload' },
        { key: 'analytics', to: '/analytics', label: 'Insights' },
    ];

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <>
            <nav className="iq-navbar" id="main-navbar">
                <div className="iq-navbar-inner">
                    <Link to="/dashboard" className="iq-brand" style={{ textDecoration: 'none' }}>
                        <div className="iq-brand-icon" style={{ background: accentColor }}>
                            <Cpu size={18} />
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
                                {link.label}
                                {activePage === link.key && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="iq-nav-indicator"
                                        style={{ background: accentColor }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="iq-nav-user">
                        <div className="iq-avatar" style={{ background: accentColor }}>
                            {initials}
                        </div>
                        <div className="iq-user-meta">
                            <span className="iq-user-name">{user?.name}</span>
                            <span className="iq-user-role" style={{ color: accentColor }}>{roleLabel}</span>
                        </div>
                        <button onClick={onLogout} className="iq-btn-logout" title="Sign Out" id="logout-btn">
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </nav>

            <style>{`
                .iq-navbar {
                    background: #0B0F1A;
                    border-bottom: 1px solid #1F2937;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .iq-navbar-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 32px;
                    height: 64px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .iq-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #F9FAFB;
                }

                .iq-brand-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .iq-brand-text {
                    font-size: 1rem;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                }

                .iq-brand-suffix {
                    font-weight: 500;
                    font-size: 0.75rem;
                    margin-left: 6px;
                }

                .iq-nav-links {
                    display: flex;
                    gap: 4px;
                }

                .iq-nav-link {
                    color: #6B7280;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.8rem;
                    padding: 8px 16px;
                    border-radius: 8px;
                    position: relative;
                    transition: all 0.2s;
                }

                .iq-nav-link:hover {
                    color: #F9FAFB;
                    background: rgba(255, 255, 255, 0.05);
                }

                .iq-nav-link.active {
                    color: #F9FAFB;
                }

                .iq-nav-indicator {
                    position: absolute;
                    bottom: -1px;
                    left: 16px;
                    right: 16px;
                    height: 2px;
                    border-radius: 2px;
                }

                .iq-nav-user {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .iq-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: white;
                }

                .iq-user-meta {
                    display: flex;
                    flex-direction: column;
                }

                .iq-user-name {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #F9FAFB;
                    line-height: 1.2;
                }

                .iq-user-role {
                    font-size: 0.6rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    line-height: 1.2;
                }

                .iq-btn-logout {
                    background: #111827;
                    border: 1px solid #1F2937;
                    color: #4B5563;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
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
