import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import SuperAdmin from "./pages/SuperAdmin";
import TenantDashboard from "./pages/TenantDashboard";
import AdminRoute from "./components/AdminRoute";
import ToastContainer from "./components/ToastContainer";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" maxToasts={5} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <SuperAdmin />
          </AdminRoute>
        } />

        {/* Tenant dashboard routes */}
        <Route path="/:tenantId/dashboard" element={<TenantDashboard />} />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
