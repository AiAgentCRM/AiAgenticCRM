import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { register, fetchPlans } from "../services/api";

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
    <div className="auth-container d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Logo and Brand Section */}
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-lg mb-3 floating" 
                   style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-robot text-primary" style={{ fontSize: '2rem' }}></i>
              </div>
              <h2 className="text-white fw-bold mb-2">AiAgenticCRM</h2>
              <p className="text-white-50 mb-0">AI-Powered Customer Relationship Management</p>
            </div>

            {/* Registration Card */}
            <div className="card auth-card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h4 className="fw-bold text-dark mb-2">Create Your Account</h4>
                  <p className="text-muted">Start your AI-powered CRM journey today</p>
                </div>

                {error && (
                  <div className="alert alert-danger border-0 shadow-sm" 
                       style={{ borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success border-0 shadow-sm" 
                       style={{ borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-dark">
                          <i className="bi bi-building me-2 text-primary"></i>
                          Business Name
                        </label>
                        <input
                          type="text"
                          className="form-control auth-input border-0 bg-light"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          placeholder="Enter your business name"
                          required
                          style={{ 
                            borderRadius: '12px', 
                            padding: '12px 16px',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-dark">
                          <i className="bi bi-person me-2 text-primary"></i>
                          Owner Name
                        </label>
                        <input
                          type="text"
                          className="form-control auth-input border-0 bg-light"
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleChange}
                          placeholder="Enter owner name"
                          required
                          style={{ 
                            borderRadius: '12px', 
                            padding: '12px 16px',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control auth-input border-0 bg-light"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      style={{ 
                        borderRadius: '12px', 
                        padding: '12px 16px',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-dark">
                          <i className="bi bi-lock me-2 text-primary"></i>
                          Password
                        </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control auth-input border-0 bg-light"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
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
                    </div>
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-dark">
                          <i className="bi bi-shield-check me-2 text-primary"></i>
                          Confirm Password
                        </label>
                        <div className="input-group">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control auth-input border-0 bg-light"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ borderRadius: '0 12px 12px 0' }}
                          >
                            <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      <i className="bi bi-star me-2 text-primary"></i>
                      Choose Your Plan
                    </label>
                    <div className="row">
                      {plans.map((plan) => (
                        <div key={plan.planId} className="col-md-4 mb-3">
                                                     <div
                             className={`card h-100 border-0 shadow-sm cursor-pointer plan-card ${
                               formData.subscriptionPlan === plan.planId
                                 ? "border-primary shadow-lg selected"
                                 : ""
                             }`}
                            style={{ 
                              borderRadius: '16px',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => setFormData({...formData, subscriptionPlan: plan.planId})}
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-4px)';
                              e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = formData.subscriptionPlan === plan.planId 
                                ? '0 8px 25px rgba(102, 126, 234, 0.3)' 
                                : '0 4px 15px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            <div className="card-body text-center p-4">
                              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${
                                formData.subscriptionPlan === plan.planId ? 'bg-primary' : 'bg-light'
                              }`} style={{ width: '50px', height: '50px' }}>
                                <i className={`bi ${plan.planId === 'bronze' ? 'bi-award' : plan.planId === 'silver' ? 'bi-award-fill' : 'bi-gem'} ${
                                  formData.subscriptionPlan === plan.planId ? 'text-white' : 'text-primary'
                                }`} style={{ fontSize: '1.5rem' }}></i>
                              </div>
                              <h6 className="card-title fw-bold mb-2">{plan.planName}</h6>
                              <h5 className="text-primary fw-bold mb-3">
                                ₹{plan.price}
                                <small className="text-muted fw-normal">/month</small>
                              </h5>
                              <ul className="list-unstyled text-muted small mb-3">
                                <li className="mb-2">
                                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                                  {plan.initialMessageLimit} Initial Messages
                                </li>
                                <li className="mb-2">
                                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                                  {plan.conversationLimit} AI Conversations
                                </li>
                                <li className="mb-2">
                                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                                  {plan.followupLimit} Follow-up Messages
                                </li>
                              </ul>
                              <div className="form-check d-flex justify-content-center">
                                <input
                                  type="radio"
                                  name="subscriptionPlan"
                                  value={plan.planId}
                                  checked={formData.subscriptionPlan === plan.planId}
                                  onChange={handleChange}
                                  className="form-check-input"
                                  style={{ transform: 'scale(1.2)' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Create Account
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Already have an account?{" "}
                    <a 
                      href="/login" 
                      className="text-decoration-none fw-semibold"
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Sign in here
                    </a>
                  </p>
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

export default Register;
