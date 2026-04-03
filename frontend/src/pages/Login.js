import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Eye, EyeOff, Shield, ArrowLeft, Loader2, Mail, Lock, Info } from 'lucide-react';
import { MorphingButton } from '../components/ui/morphing-button';

import { API_BASE_URL as API } from '../config';

export default function Login({ onLogin }) {
  // Diagnostic log
  React.useEffect(() => {
    console.log("ApplianceIQ - Backend URL Configured:", BACKEND_URL);
    console.log("ApplianceIQ - Login API Endpoint:", `${API}/auth/login`);
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      const { session_token, user } = response.data;

      onLogin(user, session_token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const detail = error.response?.data?.detail || error.response?.data || error.message;
      setError(detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background patterns */}

      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="login-card">
        <div className="card-header">
          <div className="logo-box">
            <Shield size={24} className="text-primary" />
          </div>
          <h1>Welcome Back</h1>
          <p>Login to your operator dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-alert">
              <Info size={16} />
              {error}
            </div>
          )}

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
                placeholder="name@company.com"
              />
            </div>
          </div>

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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-pass">Forgot password?</a>
          </div>

          <div className="submit-area">
            <MorphingButton
              buttonText={loading ? "Authenticating..." : "Sign In"}
              className="w-full"
              onSubmit={() => {
                if (!loading) {
                  const form = document.querySelector('.login-form');
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
          <p>New to ApplianceIQ? <Link to="/signup">Create an account</Link></p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
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
          transition: color 0.2s;
          z-index: 10;
        }

        .back-link:hover { color: white; }

        .login-card {
          position: relative;
          z-index: 1;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2rem;
          padding: 3.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .card-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .logo-box {
          width: 56px;
          height: 56px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: #3b82f6;
        }

        .card-header h1 {
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          margin: 0;
        }

        .card-header p {
          color: #64748b;
          margin-top: 0.5rem;
          font-size: 0.9375rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .input-field label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-left: 0.25rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 1rem;
          color: #475569;
          transition: color 0.2s;
        }

        .input-wrapper input {
          width: 100%;
          background: rgba(2, 6, 23, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.875rem 1rem 0.875rem 3rem;
          border-radius: 0.875rem;
          color: white;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(2, 6, 23, 0.6);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .input-wrapper input:focus + .field-icon {
          color: #3b82f6;
        }

        .toggle-eye {
          position: absolute;
          right: 0.875rem;
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
        }

        .toggle-eye:hover { color: white; }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #94a3b8;
        }

        .checkbox-label input {
          accent-color: #3b82f6;
        }

        .forgot-pass {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }

        .submit-area {
          margin-top: 1rem;
        }

        .card-footer {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
        }

        .card-footer p {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
        }

        .card-footer a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 700;
        }

        .card-footer a:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .login-card { padding: 2rem; }
        }
      `}</style>
    </div>
  );
}