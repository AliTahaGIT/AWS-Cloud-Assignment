"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import "./UserSettings.css"

///////////// DONE BY ABDUZAFAR MADRAIMOV (TP065584) //////////////////////////////


interface UserData {
  fullName: string
  email: string
  user_id: string
  avatar: File | null
}

function UserSettings() {
  const user_email = localStorage.getItem("userEmail");
  
  const [userData, setUserData] = useState<UserData>({
    fullName: localStorage.getItem("userFullName") || "",
    email: user_email || "",
    user_id: localStorage.getItem("userID") || '',
    avatar: null
  })

  const [avatarPreview, setAvatarPreview] = useState<string>(
    localStorage.getItem("userIMG") || "/placeholder.svg?height=120&width=120"
  )
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    if(!user_email){
      window.location.href = "/";
      return;
    }
  }, [user_email])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setHasChanges(true)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.")
        return
      }

      setUserData((prev) => ({
        ...prev,
        avatar: file,
      }))

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
      setHasChanges(true)
    }
  }

  const handleRemoveAvatar = () => {
    setUserData((prev) => ({
      ...prev,
      avatar: null,
    }))
    setAvatarPreview("/placeholder.svg?height=120&width=120")
    setHasChanges(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("fullName", userData.fullName)
      formData.append("email", userData.email)
      formData.append("user_id", userData.user_id);
      if (userData.avatar) {
        formData.append("avatar", userData.avatar)
      }

      
      const response = await fetch("http://localhost:8000/update-user-profile", {
        method: "PUT",
        body: formData,
      })


      if (response.ok) {
        // Simulate success
        alert("Settings updated successfully!")
        setHasChanges(false)
      } else {
        throw new Error("Failed to update settings")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      alert("Failed to update settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>User Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit} className="settings-form">
          {/* Avatar Section */}
          <div className="avatar-section">
            <h3>Profile Picture</h3>
            <div className="avatar-container">
              <div className="avatar-wrapper" onClick={handleAvatarClick}>
                <img src={avatarPreview || "/placeholder.svg"} alt="User Avatar" className="avatar-image" />
                <div className="avatar-overlay">
                  <svg className="camera-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Change Photo</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-input"
                disabled={isLoading}
              />
              <div className="avatar-actions">
                <button type="button" className="avatar-btn primary" onClick={handleAvatarClick} disabled={isLoading}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Upload Photo
                </button>
                <button
                  type="button"
                  className="avatar-btn secondary"
                  onClick={handleRemoveAvatar}
                  disabled={isLoading}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-fields">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                id="fullName"
                name="fullName"
                value={userData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">

            <button
              type="submit"
              className={`save-btn ${!hasChanges ? "disabled" : ""}`}
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Info Message */}
          {hasChanges && (
            <div className="changes-indicator">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              You have unsaved changes
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default UserSettings
