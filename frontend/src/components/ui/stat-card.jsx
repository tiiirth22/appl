import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, amount, percentage, isPositive }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 rounded-2xl p-6 bg-white/5 dark:bg-[#101010] shadow-md flex flex-col gap-3 relative overflow-hidden"
        >
            <div className="relative z-10">
                <h3 className="text-slate-400 font-medium text-sm lg:text-base">{title}</h3>
                <div className="flex items-end justify-between mt-2">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                        {amount}
                    </h2>
                    {percentage && (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {percentage}
                        </span>
                    )}
                </div>
            </div>
            {/* Decorative background blur */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </motion.div>
    );
};
