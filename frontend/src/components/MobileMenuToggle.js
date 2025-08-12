import React from 'react';
import './MobileMenuToggle.css';

const MobileMenuToggle = ({ onToggle, isOpen }) => {
  return (
    <button
      className={`mobile-menu-toggle ${isOpen ? 'open' : ''}`}
      onClick={onToggle}
      aria-label="Toggle mobile menu"
      aria-expanded={isOpen}
    >
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
    </button>
  );
};

export default MobileMenuToggle;
