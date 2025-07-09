"use client"
import { useState, useEffect } from "react"
import "./UserDash.css"

///////////// DONE BY ABDUZAFAR MADRAIMOV (TP065584) //////////////////////////////


interface UserRequest {
  id: string
  type: string
  description: string
  dateTime: string
}

function UserDash() {
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userEmail = localStorage.getItem("userEmail")
  const userName = localStorage.getItem("userFullName")

  useEffect(() => {
    if(!userEmail){
        window.location.href = "/";
        return;
    }

    const fetchUserRequests = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:8000/user-requests?email=${userEmail}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.detail || "Failed to load requests.")

        const formatted = data.map((item: any, index: number) => ({
          id: index.toString(),
          type: item.req_type,
          description: item.req_details,
          dateTime: item.created_at || new Date().toISOString(),
        }))

        setRequests(formatted)
      } catch (err) {
        setError("Failed to load requests. Please try again.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRequests()
  }, [])

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    }
  }

  const handleSettings = () => window.location.href = '/UserSettings'
  const handleSubmitRequest = () => window.location.href = '/RequestForm'

  return (
    <div className="user-dash">
      <div className="dash-header">
        <h1>Welcome, {userName || "User"}</h1>
        <div className="header-actions">
          <button className="action-btn settings-btn" onClick={handleSettings}>Settings</button>
          <button className="action-btn submit-btn" onClick={handleSubmitRequest}>Submit Request</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your requests...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Error Loading Requests</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="no-requests">
          <svg className="no-requests-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3>No Requests Found</h3>
          <p>You haven't submitted any requests yet.</p>
          <button className="submit-first-request-btn" onClick={handleSubmitRequest}>
            Submit Your First Request
          </button>
        </div>
      ) : (
        <div className="requests-container">
          {requests.map((request) => {
            const { date, time } = formatDateTime(request.dateTime)
            return (
              <div key={request.id} className="request-card">
                <div className="card-header">
                  <div className="request-type">
                    <svg className="type-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {request.type === "Help" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                    <span className="type-text">{request.type}</span>
                  </div>
                </div>

                <div className="card-content">
                  <p className="request-description">{request.description}</p>
                </div>

                <div className="card-footer">
                  <div className="date-time">
                    <div className="date">
                      <svg className="date-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {date}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UserDash
