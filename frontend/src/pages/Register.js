import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { register, fetchPlans } from "../services/api";
import "./Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    subscriptionPlan: "silver",
  });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await fetchPlans();
      setPlans(plansData);
    } catch (error) {
      console.error("Failed to load plans:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await register({
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        password: formData.password,
        subscriptionPlan: formData.subscriptionPlan,
      });

      if (response.message) {
        setSuccess(response.message);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.error || "Registration failed");
      }
    } catch (error) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(
    (plan) => plan.planId === formData.subscriptionPlan
  );

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-overlay"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-card register-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">🤖</div>
              <h1 className="logo-text">AiAgenticCRM</h1>
            </div>
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">Start your AI-powered business journey</p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">🏢</span>
                  <input
                    type="text"
                    className="form-input"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Enter your business name"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    className="form-input"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Enter owner name"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  className="form-input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
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
              
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            <div className="plan-selection">
              <label className="form-label">Choose Your Plan</label>
              <div className="plans-grid">
                {plans.map((plan) => (
                  <div
                    key={plan.planId}
                    className={`plan-card ${
                      formData.subscriptionPlan === plan.planId ? "selected" : ""
                    }`}
                    onClick={() => setFormData({...formData, subscriptionPlan: plan.planId})}
                  >
                    <div className="plan-header">
                      <h3 className="plan-name">{plan.planName}</h3>
                      <div className="plan-price">
                        <span className="price-amount">${plan.price}</span>
                        <span className="price-period">/month</span>
                      </div>
                    </div>
                    
                    <div className="plan-features">
                      <div className="feature">
                        <span className="feature-icon">💬</span>
                        <span>{plan.initialMessageLimit} Initial Messages</span>
                      </div>
                      <div className="feature">
                        <span className="feature-icon">🤖</span>
                        <span>{plan.conversationLimit} AI Conversations</span>
                      </div>
                      <div className="feature">
                        <span className="feature-icon">📈</span>
                        <span>{plan.followupLimit} Follow-up Messages</span>
                      </div>
                    </div>
                    
                    <div className="plan-selector">
                      <input
                        type="radio"
                        name="subscriptionPlan"
                        value={plan.planId}
                        checked={formData.subscriptionPlan === plan.planId}
                        onChange={handleChange}
                        className="plan-radio"
                      />
                      <div className="radio-custom"></div>
                    </div>
                  </div>
                ))}
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-link-text">
              Already have an account?{" "}
              <a href="/login" className="auth-link">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
