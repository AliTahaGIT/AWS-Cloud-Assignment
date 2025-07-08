"use client"
///////////// DONE BY ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) //////////////////////////////

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import "./ExpertDash.css"
import "../../components/Posts/Post.css"
import EditPostModal from "../../components/Edit Post Modal/EditPostModal"

interface BlogPost {
  title: string
  image: File | null
  description: string
}

function ExpertDash() {
  /////////////////////////////////////////////////// USE STATES ///////////////////////////////////////////////////////////////

  const [activeTab, setActiveTab] = useState<"add-post" | "my-posts" | "logout">("add-post")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState<BlogPost>({
    title: "",
    image: null,
    description: "",
  })
  const [orgPosts, setOrgPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)

  const { name } = useParams<{ name: string }>()

  ////////////////////////////////////////////////////////////// FETCH ORG POSTS //////////////////////////////////////////////////

  // Fetch posts when "my-posts" tab is opened
  useEffect(() => {
    if(!localStorage.getItem('expertFullName')){
      window.location.href = "/";
      return;
    }

    const fetchOrgPosts = async () => {
      if (activeTab === "my-posts") {
        try {
          setLoadingPosts(true)
          const res = await fetch(`${import.meta.env.VITE_API_URL}/org-posts?organization=${name}`)
          const data = await res.json()
          setOrgPosts(data)
        } catch (error) {
          console.error("Error fetching org posts:", error)
        } finally {
          setLoadingPosts(false)
        }
      }
    }

    fetchOrgPosts()
  }, [activeTab, name])

  ////////////////////////////////////////////////////////////// CAPTURE DATA /////////////////////////////////////////////////////

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({
      ...prev,
      image: file,
    }))
  }

  //////////////////////////////////////////////////////////// SEND DATA TO SERVER ///////////////////////////////////////////////////////

  const submitPostToServer = async () => {
    if (!formData.image) {
      alert("Please upload an image.")
      return
    }

    const orgName = name || "Unknown" // fallback just in case

    const data = new FormData()
    data.append("Post_Title", formData.title)
    data.append("Post_Organization", orgName) // From Login, But for Now Hard Coded
    data.append("Post_Desc", formData.description)
    data.append("image", formData.image)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/create-post`, {
        method: "POST",
        body: data,
      })
      const result = await res.json()
      if (res.ok) {
        alert("Post created successfully!")
      } else {
        alert("Error: " + result.detail || "Something went wrong.")
      }
    } catch (err) {
      alert("Network error: " + err)
    }
  }

  //////////////////////////////////////////////////////////// Submit Data ///////////////////////////////////////////////////////////////

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitPostToServer()
    setFormData({ title: "", image: null, description: "" })
    const fileInput = document.getElementById("image-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  //////////////////////////////////////////////////////////// Edit Post Functions ///////////////////////////////////////////////////////////////

  const handleEditClick = (post: any) => {
    setEditingPost(post)
    setIsEditModalOpen(true)
  }

  const handleUpdatePost = async (postId: string, title: string, description: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/update-post/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Post_Title: title,
          Post_Desc: description,
        }),
      })

      if (res.ok) {
        alert("Post updated successfully!")
        // Refresh the posts list
        const updatedRes = await fetch(`${import.meta.env.VITE_API_URL}/org-posts?organization=${name}`)
        const updatedData = await updatedRes.json()
        setOrgPosts(updatedData)
      } else {
        const error = await res.json()
        alert("Error updating post: " + (error.detail || "Something went wrong."))
      }
    } catch (err) {
      alert("Network error: " + err)
    }
  }

  const handleDeletePost = async (postId: string, PostS3Key: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/delete-post/${postId}?s3key=${PostS3Key}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (res.ok) {
        alert("Post deleted successfully!")
        window.location.reload();
      } else {
        const error = await res.json()
        alert("Error deleting post: " + (error.detail || "Something went wrong."))
      }
    } catch (err) {
      alert("Network error: " + err)
    }
  }

  //////////////////////////////////////////////////////////// Logout ///////////////////////////////////////////////////////////////

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      window.location.href = "/"
    }
  }

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
                    <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        )
      case "my-posts":
        return (
          <div className="content-section">
            <h2>{name}'s Blog Posts</h2>
            {loadingPosts ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            ) : orgPosts.length === 0 ? (
              <div className="no-posts">
                <p>No posts found for this organization.</p>
              </div>
            ) : (
              orgPosts.map((post) => (
                <div key={post.PostID} style={{ marginBottom: "2rem" }}>
                  <div className="post-card" id={post.PostID}>
                    <h2 className="post-title">{post.Post_Title}</h2>
                    <p className="post-organization">{post.Post_Organization}</p>
                    <div className="image-wrapper">
                      <img src={post.Post_IMG || "/placeholder.svg"} alt={post.Post_Title} className="post-image" />
                    </div>
                    <div className="post-content">
                      <p className="post-date">
                        📅{" "}
                        {new Date(post.Post_CreateDate).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="post-description">{post.Post_Desc}</p>
                    </div>
                    <div style={{ textAlign: "right", marginTop: "10px" }}>
                      <button className="edit-btn" onClick={() => handleEditClick(post)}>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="dashboard">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
              setActiveTab("add-post")
              setSidebarOpen(false)
            }}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add a Blog Post
          </button>

          <button
            className={`nav-item ${activeTab === "my-posts" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("my-posts")
              setSidebarOpen(false)
            }}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">{renderContent()}</main>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        postId={editingPost?.Post_ID || ""}
        PostS3Key={editingPost?.Post_S3Key || ""}
        initialTitle={editingPost?.Post_Title || ""}
        initialDescription={editingPost?.Post_Desc || ""}
        onUpdate={handleUpdatePost}
        onDelete={handleDeletePost}
      />
    </div>
  )
}

export default ExpertDash
