import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, ArrowLeft, Loader2, Mail, Lock, User, Briefcase, Info, Cpu } from 'lucide-react';

import { API_BASE_URL as API } from '../config';

export default function Signup({ onLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'business_owner'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      const response = await axios.post(`${API}/auth/signup`, signupData);
      const { session_token, user } = response.data;

      onLogin(user, session_token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      const detail = error.response?.data?.detail || error.response?.data || error.message;
      setError(detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="iq-auth" id="signup-page">
      <div className="iq-auth-glow" />

      <Link to="/" className="iq-back-link" id="back-home">
        <ArrowLeft size={14} />
        Back
      </Link>

      <div className="iq-auth-card" id="signup-card">
        <div className="iq-auth-header">
          <div className="iq-auth-logo green">
            <Cpu size={20} />
          </div>
          <h1>Create Account</h1>
          <p>Join the enterprise network for appliance intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="iq-auth-form" id="signup-form">
          {error && (
            <div className="iq-auth-error" id="signup-error">
              <Info size={14} />
              {error}
            </div>
          )}

          <div className="iq-auth-row">
            <div className="iq-auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <div className="iq-auth-input-wrap">
                <User size={16} className="iq-auth-icon" />
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="iq-auth-field">
              <label htmlFor="signup-email">Email Address</label>
              <div className="iq-auth-input-wrap">
                <Mail size={16} className="iq-auth-icon" />
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@company.com"
                />
              </div>
            </div>
          </div>

          <div className="iq-auth-field">
            <label htmlFor="signup-role">Account Type</label>
            <div className="iq-auth-input-wrap">
              <Briefcase size={16} className="iq-auth-icon" />
              <select
                id="signup-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="business_owner">Business Owner / Merchant</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>

          <div className="iq-auth-row">
            <div className="iq-auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="iq-auth-input-wrap">
                <Lock size={16} className="iq-auth-icon" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="iq-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="iq-auth-field">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <div className="iq-auth-input-wrap">
                <Lock size={16} className="iq-auth-icon" />
                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="iq-eye-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="iq-auth-submit green"
            disabled={loading}
            id="signup-submit"
          >
            {loading ? (
              <><Loader2 className="spinner" size={18} /> Creating Account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="iq-auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

      <style jsx>{`
        .iq-auth {
          min-height: 100vh;
          background: #0B0F1A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          color: #F9FAFB;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
        }
        .iq-auth-glow {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(16, 185, 129, 0.06), transparent 70%);
          pointer-events: none;
        }

        .iq-back-link {
          position: absolute;
          top: 24px;
          left: 24px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6B7280;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.8125rem;
          transition: color 200ms;
          z-index: 10;
        }
        .iq-back-link:hover { color: #F9FAFB; }

        .iq-auth-card {
          position: relative;
          z-index: 1;
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 560px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .iq-auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .iq-auth-logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .iq-auth-logo.green {
          background: linear-gradient(135deg, #10B981, #059669);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .iq-auth-header h1 {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .iq-auth-header p {
          color: #6B7280;
          margin-top: 4px;
          font-size: 0.875rem;
        }

        .iq-auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .iq-auth-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .iq-auth-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #F87171;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .iq-auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .iq-auth-field label {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6B7280;
        }
        .iq-auth-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .iq-auth-icon {
          position: absolute;
          left: 14px;
          color: #4B5563;
        }
        .iq-auth-input-wrap input,
        .iq-auth-input-wrap select {
          width: 100%;
          background: #0B0F1A;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          color: #F9FAFB;
          font-size: 0.9375rem;
          transition: all 200ms;
        }
        .iq-auth-input-wrap select {
          appearance: none;
          cursor: pointer;
        }
        .iq-auth-input-wrap input:focus,
        .iq-auth-input-wrap select:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
        }
        .iq-eye-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #4B5563;
          cursor: pointer;
          padding: 4px;
          display: flex;
        }
        .iq-eye-toggle:hover { color: #9CA3AF; }

        .iq-auth-submit {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 200ms;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25);
          margin-top: 8px;
        }
        .iq-auth-submit.green {
          background: linear-gradient(135deg, #10B981, #059669);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }
        .iq-auth-submit.green:hover:not(:disabled) {
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
        }
        .iq-auth-submit:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .iq-auth-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .iq-auth-footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }
        .iq-auth-footer p {
          color: #6B7280;
          font-size: 0.8125rem;
        }
        .iq-auth-footer a {
          color: #10B981;
          text-decoration: none;
          font-weight: 600;
        }
        .iq-auth-footer a:hover { text-decoration: underline; }

        @media (max-width: 600px) {
          .iq-auth-card { padding: 28px; }
          .iq-auth-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}