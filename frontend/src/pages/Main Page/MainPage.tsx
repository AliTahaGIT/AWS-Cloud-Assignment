"use client"

import type React from "react"

import { useState } from "react"
import "./MainPage.css"
import Post from "../../components/Posts/Post"
import Thragg from "../../assets/thragg.avif"

interface PostData {
  id: number
  title: string
  description: string
  date: string
  image: string
}

function MainPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const postsData: PostData[] = [
    {
      id: 1,
      title: "The Rise of Viltrumite Empire",
      description:
        "Exploring the brutal expansion of the Viltrumite Empire across the galaxy and how Thragg's leadership shaped their conquest. From peaceful negotiations to complete planetary domination, witness the strategic brilliance behind their unstoppable force.",
      date: "2024-01-15",
      image: Thragg,
    },
    {
      id: 2,
      title: "Thragg's Military Strategies Unveiled",
      description:
        "An in-depth analysis of Grand Regent Thragg's most effective battle tactics and how he maintained order within the Viltrumite ranks. Learn about the psychological warfare and combat techniques that made him the most feared leader in the universe.",
      date: "2024-01-12",
      image: Thragg,
    },
    {
      id: 3,
      title: "The Battle for Supremacy",
      description:
        "Witness the epic confrontations that determined the fate of entire civilizations. From hand-to-hand combat to planetary-scale warfare, discover how raw power and tactical genius collided in the most brutal conflicts ever recorded.",
      date: "2024-01-08",
      image: Thragg,
    },
    {
      id: 4,
      title: "Legacy of the Grand Regent",
      description:
        "Understanding the complex legacy left behind by one of the most powerful beings in existence. Explore how leadership, strength, and unwavering determination created a lasting impact that continues to influence galactic politics today.",
      date: "2024-01-05",
      image: Thragg,
    },
    {
      id: 5,
      title: "The Final Stand Against Earth",
      description:
        "The climactic showdown that would determine the future of humanity and the Viltrumite Empire. Witness unprecedented displays of power, sacrifice, and the ultimate test of what it means to protect one's people against impossible odds.",
      date: "2024-01-01",
      image: Thragg,
    },
  ]

  // Filter posts based on search term
  const filteredPosts = postsData.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="main-page">
      <div className="main-page-header">
        <h1>Latest Blog Posts</h1>
        <p>Discover the current Flood situations across Malaysia</p>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-wrapper">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="search-results">
              {filteredPosts.length === 0
                ? "No posts found"
                : `${filteredPosts.length} post${filteredPosts.length !== 1 ? "s" : ""} found`}
            </p>
          )}
        </div>
      </div>

      <div className="posts-container">
        {filteredPosts.length === 0 && searchTerm ? (
          <div className="no-results">
            <svg className="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33"
              />
            </svg>
            <h3>No posts found</h3>
            <p>Try searching with different keywords or clear your search to see all posts.</p>
            <button onClick={clearSearch} className="clear-search-button">
              Clear Search
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              title={post.title}
              description={post.description}
              date={post.date}
              image={post.image}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default MainPage
