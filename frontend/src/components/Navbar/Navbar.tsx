"use client";
///////////// DONE BY ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) //////////////////////////////

import { useState } from "react";
import "./Navbar.css";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isUserLogged = localStorage.getItem("userFullName");

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-brand">
          <a href="/" className="brand-link">
            <div className="brand-icon">C60</div>
            <span>Cloud60</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          <a href="/about-us" className="navbar-link">
            About
          </a>
          {isUserLogged && (
            <a href="/UserDash" className="navbar-link">
              Dashboard
            </a>
          )}
          <a
            href='/login'
            className="navbar-login-btn"
            onClick={(e) => {
              if (isUserLogged) {
                e.preventDefault();
                localStorage.clear(); 
                window.location.href = "/login"; 
              }
            }}
          >
            <svg className="login-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isUserLogged ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              )}
            </svg>
            {isUserLogged ? "Logout" : "Login"}
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <div className={`navbar-toggle ${isMenuOpen ? "active" : ""}`} onClick={toggleMenu}>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </div>

        {/* Mobile Navigation */}
        <div className={`navbar-mobile ${isMenuOpen ? "active" : ""}`}>
          <a href="/about-us" className="navbar-mobile-link" onClick={toggleMenu}>
            About
          </a>
          {isUserLogged && (
            <a href="/UserDash" className="navbar-mobile-link" onClick={toggleMenu}>
              Dashboard
            </a>
          )}
          <a
            href='/login'
            className="navbar-mobile-login"
            onClick={(e) => {
              toggleMenu();

              if (isUserLogged) {
                e.preventDefault();
                localStorage.clear(); 
                window.location.href = "/login"; 
              }
            }}
          >
            {isUserLogged ? "Logout" : "Login"}
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
