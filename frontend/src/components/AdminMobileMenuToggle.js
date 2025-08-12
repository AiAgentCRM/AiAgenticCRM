import React from 'react';
import './AdminMobileMenuToggle.css';

const AdminMobileMenuToggle = ({ onToggle, isOpen }) => {
  return (
    <button
      className={`admin-mobile-menu-toggle ${isOpen ? 'open' : ''}`}
      onClick={onToggle}
      aria-label="Toggle mobile menu"
      aria-expanded={isOpen}
    >
      <span className="admin-hamburger-line"></span>
      <span className="admin-hamburger-line"></span>
      <span className="admin-hamburger-line"></span>
    </button>
  );
};

export default AdminMobileMenuToggle;
