import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, fetchPlans } from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login({ email, password });
      if (response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("tenantId", response.tenantId);
        localStorage.setItem("businessName", response.businessName);
        localStorage.setItem("ownerName", response.ownerName);
        navigate(`/${response.tenantId}/dashboard`);
      } else {
        setError(response.error || "Login failed");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            {/* Logo and Brand Section */}
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-lg mb-3 floating" 
                   style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-robot text-primary" style={{ fontSize: '2rem' }}></i>
              </div>
              <h2 className="text-white fw-bold mb-2">AiAgenticCRM</h2>
              <p className="text-white-50 mb-0">AI-Powered Customer Relationship Management</p>
            </div>

            {/* Login Card */}
            <div className="card auth-card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h4 className="fw-bold text-dark mb-2">Welcome Back</h4>
                  <p className="text-muted">Sign in to your business account</p>
                </div>

                {error && (
                  <div className="alert alert-danger border-0 shadow-sm" 
                       style={{ borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      Email Address
                    </label>
                    <div className="input-group">
                      <input
                        type="email"
                        className="form-control auth-input border-0 bg-light"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        style={{ 
                          borderRadius: '12px', 
                          padding: '12px 16px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      <i className="bi bi-lock me-2 text-primary"></i>
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control auth-input border-0 bg-light"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        style={{ 
                          borderRadius: '12px 0 0 12px', 
                          padding: '12px 16px',
                          fontSize: '16px'
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary border-0 bg-light"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ borderRadius: '0 12px 12px 0' }}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="rememberMe" />
                      <label className="form-check-label text-muted" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary auth-btn w-100 border-0 shadow-sm"
                    disabled={loading}
                    style={{ 
                      borderRadius: '12px', 
                      padding: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don't have an account?{" "}
                    <a 
                      href="/register" 
                      className="text-decoration-none fw-semibold"
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Create one here
                    </a>
                  </p>
                </div>

                <div className="text-center mt-3">
                  <a 
                    href="#" 
                    className="text-decoration-none text-muted small"
                    style={{ fontSize: '14px' }}
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-white-50 small mb-0">
                © 2024 AiAgenticCRM. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
