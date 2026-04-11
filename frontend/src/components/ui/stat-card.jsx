import React from 'react';
import { motion } from 'motion/react';

export const StatCard = ({ title, amount, icon, color = 'blue' }) => {
    const colorMap = {
        blue: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
        emerald: { bg: 'rgba(16,185,129,0.1)', text: '#10B981' },
        violet: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6' },
        amber: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
        rose: { bg: 'rgba(244,63,94,0.1)', text: '#F43F5E' },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'border-color 200ms, box-shadow 200ms',
            }}
        >
            {icon && (
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: c.bg,
                    color: c.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {icon}
                </div>
            )}
            <div>
                <div style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: '#F9FAFB',
                }}>
                    {amount}
                </div>
                <div style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    fontWeight: 500,
                    marginTop: '4px',
                }}>
                    {title}
                </div>
            </div>
        </motion.div>
    );
};
