import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/api";
import "./Auth.css";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Check if admin is already logged in
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await adminLogin({ username, password });
      if (response.token) {
        localStorage.setItem("adminToken", response.token);
        localStorage.setItem("adminData", JSON.stringify(response.admin));
        navigate("/admin");
      } else {
        setError(response.error || "Login failed");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-overlay"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">👑</div>
              <h1 className="logo-text">Admin Panel</h1>
            </div>
            <h2 className="auth-title">Admin Access</h2>
            <p className="auth-subtitle">Sign in to the admin dashboard</p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <div className="input-wrapper">
                {/* <span className="input-icon">👤</span> */}
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                {/* <span className="input-icon">🔒</span> */}
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-link-text">
              Need help?{" "}
              <a href="/login" className="auth-link">
                Contact support
              </a>
            </p>
          </div>

          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span className="feature-text">Secure Authentication</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">System Management</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚙️</span>
              <span className="feature-text">Admin Controls</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
