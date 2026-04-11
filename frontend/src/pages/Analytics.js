import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Star, Loader, Activity, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/ui/Navbar';

import { API_BASE_URL as API } from '../config';

export default function Analytics({ user, onLogout }) {
  const [queries, setQueries] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [queriesRes, feedbackRes] = await Promise.all([
        axios.get(`${API}/analytics/queries`, { withCredentials: true }),
        axios.get(`${API}/feedback`, { withCredentials: true })
      ]);

      setQueries(queriesRes.data.queries || []);
      setFeedback(feedbackRes.data.feedback || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '0';

  return (
    <div className="iq-analytics" id="analytics-page">
      <Navbar user={user} onLogout={onLogout} activePage="analytics" />

      <div className="iq-analytics-main">
        <header className="iq-analytics-header" id="analytics-header">
          <div>
            <h1>Intelligence Reports</h1>
            <p>Query performance and user sentiment analytics.</p>
          </div>
          <button className="iq-btn-glass">
            <Filter size={14} /> Last 30 Days
          </button>
        </header>

        {/* KPI */}
        <div className="iq-analytics-kpi" id="analytics-kpis">
          {[
            { label: 'Total Conversations', value: queries.length, color: 'blue', icon: <MessageSquare size={18} /> },
            { label: 'Avg. Rating', value: `${avgRating}/5`, color: 'amber', icon: <Star size={18} /> },
            { label: 'Feedback Points', value: feedback.length, color: 'emerald', icon: <Activity size={18} /> },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="iq-an-kpi-card"
            >
              <div className={`iq-an-icon ${kpi.color}`}>{kpi.icon}</div>
              <div className="iq-an-body">
                <span className="iq-an-value">{kpi.value}</span>
                <span className="iq-an-label">{kpi.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="iq-loading">
            <Loader className="spinner" size={32} />
            <span>Processing data streams...</span>
          </div>
        ) : (
          <div className="iq-analytics-layout">
            {/* Query Log */}
            <section className="iq-an-section" id="query-log">
              <div className="iq-section-head">
                <div className="iq-sh-title">
                  <Activity size={18} />
                  <h2>Knowledge Retrieval Log</h2>
                </div>
              </div>

              <div className="iq-an-table-card">
                {queries.length === 0 ? (
                  <div className="iq-an-empty">
                    <MessageSquare size={36} />
                    <p>No queries recorded yet.</p>
                  </div>
                ) : (
                  <table className="iq-an-table">
                    <thead>
                      <tr>
                        <th>Inquiry</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queries.map((q, i) => (
                        <tr key={q.id || i}>
                          <td className="iq-an-query-cell">
                            <span className="iq-an-question">{q.question}</span>
                            <span className="iq-an-answer">{q.answer.substring(0, 100)}...</span>
                          </td>
                          <td><span className="iq-an-status-badge">Active</span></td>
                          <td className="iq-an-date">{new Date(q.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Feedback */}
            <aside className="iq-an-aside" id="feedback-section">
              <div className="iq-section-head">
                <div className="iq-sh-title">
                  <Star size={18} />
                  <h2>User Feedback</h2>
                </div>
              </div>

              <div className="iq-fb-stack">
                {feedback.length === 0 ? (
                  <p className="iq-an-no-data">No feedback recorded yet.</p>
                ) : (
                  feedback.map((f, i) => (
                    <div className="iq-fb-item" key={f.id || i}>
                      <div className="iq-fb-top">
                        <div className="iq-fb-stars">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              size={12}
                              fill={idx < f.rating ? '#F59E0B' : 'none'}
                              color={idx < f.rating ? '#F59E0B' : '#374151'}
                            />
                          ))}
                        </div>
                        <span className="iq-fb-date">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      {f.comment && <p className="iq-fb-comment">{f.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <style jsx>{`
        .iq-analytics {
          min-height: 100vh;
          background: #0B0F1A;
          color: #F9FAFB;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .iq-analytics-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px;
        }

        .iq-analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .iq-analytics-header h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; }
        .iq-analytics-header p { color: #6B7280; margin-top: 4px; font-size: 0.9375rem; }

        .iq-btn-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #D1D5DB;
          padding: 8px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 200ms;
        }
        .iq-btn-glass:hover { background: rgba(255,255,255,0.08); }

        /* KPI */
        .iq-analytics-kpi {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .iq-an-kpi-card {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 200ms;
        }
        .iq-an-kpi-card:hover { border-color: rgba(255,255,255,0.12); }
        .iq-an-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .iq-an-icon.blue { background: rgba(59,130,246,0.1); color: #3B82F6; }
        .iq-an-icon.amber { background: rgba(245,158,11,0.1); color: #F59E0B; }
        .iq-an-icon.emerald { background: rgba(16,185,129,0.1); color: #10B981; }
        .iq-an-value { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em; display: block; line-height: 1; }
        .iq-an-label { font-size: 0.75rem; color: #6B7280; font-weight: 500; display: block; margin-top: 4px; }

        /* Layout */
        .iq-analytics-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .iq-section-head { margin-bottom: 16px; }
        .iq-sh-title { display: flex; align-items: center; gap: 8px; color: #3B82F6; }
        .iq-sh-title h2 { font-size: 1rem; font-weight: 700; color: #F9FAFB; }

        .iq-an-table-card {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }
        .iq-an-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .iq-an-table th {
          padding: 14px 20px;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6B7280;
          font-weight: 700;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .iq-an-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
        }
        .iq-an-table tr:hover td { background: rgba(255,255,255,0.02); }

        .iq-an-query-cell { max-width: 380px; }
        .iq-an-question { display: block; font-weight: 600; font-size: 0.8125rem; margin-bottom: 4px; }
        .iq-an-answer {
          display: block;
          font-size: 0.75rem;
          color: #6B7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .iq-an-status-badge {
          background: rgba(16,185,129,0.1);
          color: #10B981;
          font-size: 0.5625rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
        .iq-an-date { font-size: 0.75rem; color: #4B5563; }

        .iq-an-empty {
          padding: 64px;
          text-align: center;
          color: #4B5563;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        /* Feedback */
        .iq-fb-stack { display: flex; flex-direction: column; gap: 12px; }
        .iq-fb-item {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.06);
          padding: 20px;
          border-radius: 14px;
          transition: all 200ms;
        }
        .iq-fb-item:hover { border-color: rgba(255,255,255,0.12); }
        .iq-fb-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .iq-fb-stars { display: flex; gap: 2px; }
        .iq-fb-date { font-size: 0.6875rem; color: #4B5563; }
        .iq-fb-comment { font-size: 0.8125rem; color: #9CA3AF; line-height: 1.6; margin: 0; }
        .iq-an-no-data { color: #4B5563; font-size: 0.8125rem; text-align: center; padding: 32px; }

        .iq-loading {
          padding: 80px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #6B7280;
        }

        @media (max-width: 1100px) {
          .iq-analytics-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .iq-analytics-main { padding: 16px; }
          .iq-analytics-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .iq-analytics-kpi { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
