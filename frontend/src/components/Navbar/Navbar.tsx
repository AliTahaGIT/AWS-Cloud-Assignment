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
            MYFlood
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          <a href="/about-us" className="navbar-link">
            About
          </a>
          {isUserLogged && (
            <a href="/user-dashboard" className="navbar-link">
              Dashboard
            </a>
          )}
          <a
            href='/login'
            className="navbar-mobile-login"
            onClick={(e) => {
              toggleMenu();

              if (isUserLogged) {
                e.preventDefault(); // prevent navigation for logout
                localStorage.clear(); 
                window.location.href = "/login"; 
              }
            }}
          >
            {isUserLogged ? "Logout" : "Login"}
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="navbar-toggle" onClick={toggleMenu}>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </div>

        {/* Mobile Navigation */}
        <div className={`navbar-mobile ${isMenuOpen ? "active" : ""}`}>
          <a href="/about" className="navbar-mobile-link" onClick={toggleMenu}>
            About us
          </a>
          {isUserLogged && (
            <a href="/user-dashboard" className="navbar-link">
              Dashboard
            </a>
          )}
          <a
            href='/login'
            className="navbar-mobile-login"
            onClick={(e) => {
              toggleMenu();

              if (isUserLogged) {
                e.preventDefault(); // prevent navigation for logout
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
