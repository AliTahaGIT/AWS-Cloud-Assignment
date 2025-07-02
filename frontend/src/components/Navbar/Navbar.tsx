"use client"
///////////// DONE BY ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) //////////////////////////////


import { useState } from "react"
import "./Navbar.css"

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

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
          <a href="/about" className="navbar-link">
            About us
          </a>
          <a href="/guide" className="navbar-link">
            Guide
          </a>
          <a href="/login" className="navbar-login-btn">
            Login
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
          <a href="/guide" className="navbar-mobile-link" onClick={toggleMenu}>
            Guide
          </a>
          <a href="/login" className="navbar-mobile-login" onClick={toggleMenu}>
            Login
          </a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
