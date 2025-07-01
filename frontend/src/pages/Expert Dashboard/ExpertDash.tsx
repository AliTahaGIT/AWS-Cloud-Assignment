"use client";

import type React from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import "./ExpertDash.css";

interface BlogPost {
  title: string;
  image: File | null;
  description: string;
}

function ExpertDash() {
  /////////////////////////////////////////////////// USE STATES ///////////////////////////////////////////////////////////////
  const [activeTab, setActiveTab] = useState<
    "add-post" | "my-posts" | "logout"
  >("add-post");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<BlogPost>({
    title: "",
    image: null,
    description: "",
  });

  const { name } = useParams<{ name: string }>();
////////////////////////////////////////////////////////////// CAPTURE DATA /////////////////////////////////////////////////////
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      image: file,
    }));
  };
//////////////////////////////////////////////////////////// SEND DATA TO SERVER ///////////////////////////////////////////////////////
const submitPostToServer = async () => {
  if (!formData.image) {
    alert("Please upload an image.");
    return;
  }

  const orgName = name || "Unknown"; // fallback just in case
  const data = new FormData();
  data.append("Post_Title", formData.title);
  data.append("Post_Organization", orgName); // From Login, But for Now Hard Coded
  data.append("Post_Desc", formData.description);
  data.append("image", formData.image);

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/create-post`, {
      method: "POST",
      body: data,
    });

    const result = await res.json();
    if (res.ok) {
      alert("Post created successfully!");
    } else {
      alert("Error: " + result.detail || "Something went wrong.");
    }
  } catch (err) {
    alert("Network error: " + err);
  }
};
//////////////////////////////////////////////////////////// Submit Data ///////////////////////////////////////////////////////////////
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPostToServer();
    setFormData({ title: "", image: null, description: "" });

    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };
//////////////////////////////////////////////////////////// Logout ///////////////////////////////////////////////////////////////
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      window.location.href = "/";
    }
  };
///////////////////////////////////////////////////////////// UI //////////////////////////////////////////////////////////////////
  const renderContent = () => {
    switch (activeTab) {
      case "add-post":
        return (
          <div className="content-section">
            <h2>Add a Blog Post</h2>
            <form onSubmit={handleSubmit} className="blog-form">
              <div className="form-group">
                <label htmlFor="title">Post Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your blog post title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="image-upload">Post Image</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="image-upload"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  <label htmlFor="image-upload" className="file-input-label">
                    <svg
                      className="upload-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {formData.image ? formData.image.name : "Choose an image"}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Post Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Write your blog post content here..."
                  rows={8}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">
                Submit Post
              </button>
            </form>
          </div>
        );
      case "my-posts":
        return (
          <div className="content-section">
            <h2>My Blog Posts</h2>
            <p className="coming-soon">Coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h1>Expert Dashboard</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "add-post" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("add-post");
              setSidebarOpen(false);
            }}
          >
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add a Blog Post
          </button>

          <button
            className={`nav-item ${activeTab === "my-posts" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("my-posts");
              setSidebarOpen(false);
            }}
          >
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            My Blog Posts
          </button>

          <button className="nav-item logout" onClick={handleLogout}>
            <svg
              className="nav-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">{renderContent()}</main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
}

export default ExpertDash;
