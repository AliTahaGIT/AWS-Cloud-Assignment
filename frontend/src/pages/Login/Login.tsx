"use client";

import type React from "react";
import { useState } from "react";
import "./Login.css";
import API_ENDPOINTS from "../../config/api";
import useToast from "../../hooks/useToast";
import ToastContainer from "../../components/Toast/ToastContainer";

///////////// DONE BY AHMED MOHAMED AHMED ABDELGADIR (TP070007) //////////////////////////////


interface LoginData {
  role: string;
  email: string;
  password: string;
}

interface SignupData extends LoginData {
  confirmPassword: string;
  fullName: string;
}

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const [loginData, setLoginData] = useState<LoginData>({
    role: "",
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState<SignupData>({
    role: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  const roles = [
    { value: "", label: "Select your role" },
    { value: "user", label: "User" },
    { value: "expert", label: "Expert" },
  ];
  ////////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////////////////
  const handleLoginChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignupChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  //////////////////////////////////////////////////////////// LOGIN AND SIGNUP /////////////////////////////////////////////////////
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", loginData.email);
      formData.append("password", loginData.password);
      formData.append("role", loginData.role); 


      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess("Login Successful!", `Welcome back! Redirecting to your dashboard...`);

        const fullName = result.fullName;
        const email = result.email;
        const img = result.s3_url;
        const userID = result.user_id;

        console.log(img)

        setTimeout(() => {
          if (loginData.role === "user") {
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userFullName", fullName);
            localStorage.setItem("userIMG", img);
            localStorage.setItem("userID", userID);
            window.location.href = `/`;
          } else {
            localStorage.setItem("expertFullName", fullName);
            window.location.href = `/ExpertDash/${fullName}`;
          }
        }, 1500);
      } else {
        showError("Login Failed", result.detail || "Please check your credentials and try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      showError("Network Error", "Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    const { fullName, email, password, confirmPassword, role } = signupData;

    if (!fullName || !email || !password || !confirmPassword) {
      showError("Missing Information", "All fields are required to create an account.");
      return;
    }

    const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailPattern.test(email)) {
      showError("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showError("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Password Mismatch", "Passwords do not match. Please check and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role); 


      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess("Account Created Successfully!", "Welcome to Cloud60! You can now log in with your credentials.");
        setIsLogin(true);
        setSignupData({
          role: "",
          email: "",
          password: "",
          confirmPassword: "",
          fullName: "",
        });
      } else {
        showError("Signup Failed", result.error || "Unable to create account. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      showError("Network Error", "Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const isLoginValid = loginData.role && loginData.email && loginData.password;
  const isSignupValid =
    signupData.role &&
    signupData.email &&
    signupData.password &&
    signupData.confirmPassword &&
    signupData.fullName &&
    signupData.password === signupData.confirmPassword;
  /////////////////////////////////////////////////// UI ///////////////////////////////////////////////////////////////////////
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p>
            {isLogin ? "Sign in to your account" : "Join our community today"}
          </p>
        </div>

        <div className="form-toggle">
          <button
            className={`toggle-btn ${isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(true)}
            disabled={isLoading}
          >
            Login
          </button>
          <button
            className={`toggle-btn ${!isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(false)}
            disabled={isLoading}
          >
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="login-role" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Role
              </label>
              <select
                id="login-role"
                name="role"
                value={loginData.role}
                onChange={handleLoginChange}
                className="form-select"
                required
                disabled={isLoading}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Enter your email"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  className="form-input"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`submit-button ${!isLoginValid ? "disabled" : ""}`}
              disabled={!isLoginValid || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <svg
                    className="submit-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Full Name
              </label>
              <input
                type="text"
                id="signup-name"
                name="fullName"
                value={signupData.fullName}
                onChange={handleSignupChange}
                placeholder="Enter your full name"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="signup-role" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                  />
                </svg>
                Role
              </label>
              <select
                id="signup-role"
                name="role"
                value={signupData.role}
                onChange={handleSignupChange}
                className="form-select"
                required
                disabled={isLoading}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </label>
              <input
                type="email"
                id="signup-email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                placeholder="Enter your email"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="signup-password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  placeholder="Create a password"
                  className="form-input"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="signup-confirm-password" className="form-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="signup-confirm-password"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  placeholder="Confirm your password"
                  className={`form-input ${
                    signupData.confirmPassword &&
                    signupData.password !== signupData.confirmPassword
                      ? "error"
                      : ""
                  }`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {signupData.confirmPassword &&
                signupData.password !== signupData.confirmPassword && (
                  <div className="error-message">Passwords do not match</div>
                )}
            </div>

            <button
              type="submit"
              className={`submit-button ${!isSignupValid ? "disabled" : ""}`}
              disabled={!isSignupValid || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <svg
                    className="submit-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              className="link-button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
            >
              {isLogin ? "Sign up here" : "Sign in here"}
            </button>
          </p>
        </div>

        <div className="admin-access">
          <div className="divider">
            <span>or</span>
          </div>
          <button
            className="admin-login-button"
            onClick={() => window.location.href = '/admin-login'}
            disabled={isLoading}
          >
            <svg
              className="admin-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Admin Login
          </button>
        </div>

        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  );
}

export default Login;
