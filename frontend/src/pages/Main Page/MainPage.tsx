"use client";
///////////// DONE BY ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) //////////////////////////////


import type React from "react";

import { useState, useEffect } from "react";
import "./MainPage.css";
import Post from "../../components/Posts/Post";

interface PostData {
  Post_ID: string;
  Post_Title: string;
  Post_Desc: string;
  Post_IMG: string;
  Post_Organization: string;
  Post_CreateDate: string;
  Post_S3Key: string;
}

interface Announcement {
  announcement_id: string;
  title: string;
  content: string;
  created_at: string;
}

function MainPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
////////////////////////////////////////////////////// Fetch Posts //////////////////////////////////////////////////
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/posts`);
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/public/announcements`);
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.announcements || []);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchPosts();
    fetchAnnouncements();
  }, []);
  ////////////////////////////////////////////////////// Search Function //////////////////////////////////////////////////
  // Filter posts based on search term
  const filteredPosts = posts.filter(
    (post) =>
      post.Post_Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.Post_Desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handlePostClick = (post: PostData) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="main-page">
      <div className="main-page-header">
        <h1>Cloud60 Disaster Management</h1>
        <p className="hero-subtitle">Real-time flood monitoring and emergency response system for Malaysia</p>
        
      </div>

      {/* Search Section */}
      <div className="search-container">
        <div className="search-wrapper">
          <svg
            className="search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-search-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="search-results">
            {filteredPosts.length === 0
              ? "No posts found matching your search"
              : `Found ${filteredPosts.length} post${
                  filteredPosts.length !== 1 ? "s" : ""
                } matching "${searchTerm}"`}
          </p>
        )}
      </div>

      {/* Announcement Overlay - Show only most recent */}
      {announcements.length > 0 && (
        <div className="announcement-overlay">
          <div className="announcement-bar">
            <div className="announcement-wrapper">
              <div className="announcement-text">
                <strong>{announcements[0].title}</strong>: {announcements[0].content}
              </div>
              <button 
                className="announcement-close"
                onClick={() => setAnnouncements(announcements.slice(1))}
                aria-label="Close announcement"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="posts-container">
        <div className="section-header">
          <h2 className="section-title">Latest Blog Posts</h2>
          <p className="section-subtitle">
            Read our latest updates and important information
          </p>
        </div>

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Loading latest posts...</p>
          </div>
        ) : filteredPosts.length === 0 && searchTerm ? (
          <div className="no-results">
            <svg
              className="no-results-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3>No Posts Found</h3>
            <p>
              We couldn't find any posts matching your search criteria. 
              Try different keywords or browse all available posts.
            </p>
            <button onClick={clearSearch} className="clear-search-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear Search
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-results">
            <svg
              className="no-results-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3>No Posts Available</h3>
            <p>
              There are currently no blog posts available. Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post) => (
              <Post
                key={post.Post_ID}
                id={post.Post_ID}
                title={post.Post_Title}
                description={post.Post_Desc}
                date={post.Post_CreateDate}
                image={post.Post_IMG}
                organization={post.Post_Organization}
                S3Key={post.Post_S3Key}
                onClick={() => handlePostClick(post)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal-content post-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPost.Post_Title}</h2>
              <button className="modal-close" onClick={() => setShowPostModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="post-detail-content">
              <div className="post-detail-meta">
                <span className="post-detail-org">{selectedPost.Post_Organization}</span>
                <span className="post-detail-date">
                  {new Date(selectedPost.Post_CreateDate.split('.')[0]).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <img 
                src={selectedPost.Post_IMG} 
                alt={selectedPost.Post_Title}
                className="post-detail-image"
              />
              
              <div className="post-detail-description">
                <p>{selectedPost.Post_Desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainPage;
