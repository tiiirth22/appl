import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Eye, EyeOff, Shield, ArrowLeft, Mail, Lock, User, Briefcase, Info } from 'lucide-react';
import { MorphingButton } from '../components/ui/morphing-button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    <div className="signup-page">

      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="signup-card">
        <div className="card-header">
          <div className="logo-box">
            <UserPlus size={24} className="text-secondary" />
          </div>
          <h1>Create Account</h1>
          <p>Join the enterprise network for appliance IQ</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && (
            <div className="error-alert">
              <Info size={16} />
              {error}
            </div>
          )}

          <div className="form-grid">
            <div className="input-field">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="field-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="input-field">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="field-icon" />
                <input
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

          <div className="input-field">
            <label>Account Type</label>
            <div className="input-wrapper">
              <Briefcase size={18} className="field-icon" />
              <select
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

          <div className="form-grid">
            <div className="input-field">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-field">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="field-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="submit-area">
            <MorphingButton
              buttonText={loading ? "Creating..." : "Create Account"}
              className="w-full"
              onSubmit={() => {
                if (!loading) {
                  const form = document.querySelector('.signup-form');
                  if (form.checkValidity()) {
                    handleSubmit();
                  } else {
                    form.reportValidity();
                  }
                }
              }}
            />
          </div>
        </form>

        <div className="card-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          background: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: white;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        .back-link {
          position: absolute;
          top: 2rem;
          left: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: 0.2s;
          z-index: 10;
        }
        .back-link:hover { color: white; }

        .signup-card {
          position: relative;
          z-index: 1;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2.5rem;
          padding: 3.5rem;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .card-header { text-align: center; margin-bottom: 2.5rem; }
        .logo-box {
          width: 56px;
          height: 56px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: #10b981;
        }
        .card-header h1 { font-size: 1.875rem; font-weight: 800; letter-spacing: -0.05em; margin: 0; }
        .card-header p { color: #64748b; margin-top: 0.5rem; font-size: 0.9375rem; }

        .signup-form { display: flex; flex-direction: column; gap: 1.25rem; }
        
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .input-field { display: flex; flex-direction: column; gap: 0.625rem; }
        .input-field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 1rem; color: #475569; transition: 0.2s; }
        
        .input-wrapper input, .input-wrapper select {
          width: 100%;
          background: rgba(2, 6, 23, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.875rem 1rem 0.875rem 3rem;
          border-radius: 0.875rem;
          color: white;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .input-wrapper select { appearance: none; }
        .input-wrapper input:focus, .input-wrapper select:focus {
          outline: none; border-color: #10b981; background: rgba(2, 6, 23, 0.6);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        
        .toggle-eye { position: absolute; right: 0.875rem; background: none; border: none; color: #475569; cursor: pointer; }
        .toggle-eye:hover { color: white; }

        .submit-area { margin-top: 1.5rem; }

        .card-footer {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
        }
        .card-footer p { color: #64748b; font-size: 0.875rem; }
        .card-footer a { color: #10b981; text-decoration: none; font-weight: 700; }

        @media (max-width: 600px) {
          .signup-card { padding: 2rem; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}