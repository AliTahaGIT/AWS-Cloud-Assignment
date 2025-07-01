"use client";

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
        <h1>Latest Blog Posts</h1>
        <p>Discover the current Flood situations across Malaysia</p>

        {/* Search Bar */}
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
              placeholder="Search posts by title or content..."
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
                ? "No posts found"
                : `${filteredPosts.length} post${
                    filteredPosts.length !== 1 ? "s" : ""
                  } found`}
            </p>
          )}
        </div>
      </div>

      {/* Post Section */}
      <div className="posts-container">
        {loading ? (
          <div className="loading-section">
            <svg className="loading-spinner" viewBox="0 0 50 50">
              <circle
                className="loading-path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="5"
              />
            </svg>
            <p>Loading posts...</p>
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
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33"
              />
            </svg>
            <h3>No posts found</h3>
            <p>
              Try searching with different keywords or clear your search to see
              all posts.
            </p>
            <button onClick={clearSearch} className="clear-search-button">
              Clear Search
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
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
          ))
        )}
      </div>
    </div>
  );
}

export default MainPage;
