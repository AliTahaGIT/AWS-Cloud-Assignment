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

function MainPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
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

    fetchPosts();
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
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="main-page">
      <div className="main-page-header">
        <h1>Cloud60 Disaster Management</h1>
        <p className="hero-subtitle">Real-time flood monitoring and emergency response system for Malaysia</p>
        
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">{posts.length}</span>
            <span className="stat-label">Active Reports</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Monitoring</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">13</span>
            <span className="stat-label">States Covered</span>
          </div>
        </div>
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
            placeholder="Search disaster reports, updates, and alerts..."
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
              ? "No reports found matching your search"
              : `Found ${filteredPosts.length} report${
                  filteredPosts.length !== 1 ? "s" : ""
                } matching "${searchTerm}"`}
          </p>
        )}
      </div>

      {/* Posts Section */}
      <div className="posts-container">
        <div className="section-header">
          <h2 className="section-title">Latest Disaster Reports</h2>
          <p className="section-subtitle">
            Stay informed with real-time updates from emergency response teams across Malaysia
          </p>
        </div>

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Loading latest reports...</p>
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
            <h3>No Reports Found</h3>
            <p>
              We couldn't find any reports matching your search criteria. 
              Try different keywords or browse all available reports.
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
            <h3>No Reports Available</h3>
            <p>
              There are currently no disaster reports available. Check back later for updates.
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;
