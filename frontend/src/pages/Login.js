import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }
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
    <div className="login-container">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="particles-container">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                '--delay': `${Math.random() * 15}s`,
                '--duration': `${8 + Math.random() * 15}s`,
                '--size': `${2 + Math.random() * 6}px`,
                '--x': `${Math.random() * 100}%`,
                '--y': `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        
        {/* Floating Shapes */}
        <div className="floating-shapes">
          <div className="shape shape-hexagon" style={{ transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)` }}></div>
          <div className="shape shape-circle" style={{ transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * -10}px)` }}></div>
          <div className="shape shape-triangle" style={{ transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)` }}></div>
        </div>

        {/* Gradient Orbs */}
        <div className="gradient-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>
      </div>

      {/* Centered Login Content */}
      <div className="login-content">
        <div className="login-wrapper">
          {/* Brand Header */}
          <div className="brand-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <i className="bi bi-robot"></i>
              </div>
              <div className="logo-glow"></div>
            </div>
            <h1 className="brand-title">
              <span className="title-main">AiAgentic</span>
              <span className="title-accent">CRM</span>
            </h1>
            <p className="brand-subtitle">AI-Powered Customer Relationship Management</p>
          </div>

          {/* Login Card */}
          <div className="login-card">
            <div className="card-header">
              <h2 className="welcome-title">Welcome Back</h2>
              <p className="welcome-subtitle">Sign in to your account</p>
            </div>

            <div className="card-body">
              {error && (
                <div className="error-alert">
                  <div className="error-icon">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <div className="error-content">
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <i className="bi bi-envelope"></i>
                    </div>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused({ ...isFocused, email: true })}
                      onBlur={() => setIsFocused({ ...isFocused, email: false })}
                      placeholder="Email address"
                      required
                    />
                    <div className="input-border"></div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-wrapper">
                    <div className="input-icon">
                      <i className="bi bi-lock"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsFocused({ ...isFocused, password: true })}
                      onBlur={() => setIsFocused({ ...isFocused, password: false })}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                    <div className="input-border"></div>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="checkmark"></span>
                    <span className="checkbox-label">Remember me</span>
                  </label>
                  <button type="button" className="forgot-link">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className={`login-button ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i>
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              <div className="divider">
                <span>or</span>
              </div>

              <button className="google-button">
                <i className="bi bi-google"></i>
                <span>Continue with Google</span>
              </button>

              <div className="register-prompt">
                <p>
                  Don't have an account?{" "}
                  <button type="button" className="link-primary" onClick={() => navigate('/register')}>
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p className="copyright">&copy; 2024 AiAgenticCRM. All rights reserved.</p>
            <div className="footer-links">
              <button type="button" className="footer-link">Privacy</button>
              <button type="button" className="footer-link">Terms</button>
              <button type="button" className="footer-link">Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
