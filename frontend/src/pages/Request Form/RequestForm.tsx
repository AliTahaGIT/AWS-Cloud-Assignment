"use client";

import type React from "react";
import { useState, useEffect } from "react";
import "./RequestForm.css";

///////////// DONE BY ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) //////////////////////////////


interface FormData {
  region: string;
  details: string;
  type: string;
}

function RequestForm() {
  const [formData, setFormData] = useState<FormData>({
    region: "",
    details: "",
    type: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const user_email = localStorage.getItem("userEmail");
  const user_name = localStorage.getItem("userFullName");

  const regions = [
    { value: "", label: "Select a state" },
    { value: "johor", label: "Johor" },
    { value: "kedah", label: "Kedah" },
    { value: "kelantan", label: "Kelantan" },
    { value: "kuala_lumpur", label: "Kuala Lumpur" },
    { value: "labuan", label: "Labuan" },
    { value: "malacca", label: "Malacca" },
    { value: "negeri_sembilan", label: "Negeri Sembilan" },
    { value: "pahang", label: "Pahang" },
    { value: "penang", label: "Penang" },
    { value: "perak", label: "Perak" },
    { value: "perlis", label: "Perlis" },
    { value: "putrajaya", label: "Putrajaya" },
    { value: "sabah", label: "Sabah" },
    { value: "sarawak", label: "Sarawak" },
    { value: "selangor", label: "Selangor" },
    { value: "terengganu", label: "Terengganu" },
  ];

  const types = [
    { value: "", label: "Select request type" },
    { value: "help", label: "Help" },
    { value: "report", label: "Report" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
      if(!user_email){
        window.location.href = "/";
        return;
      }
    }, [user_email])
  ////////////////////////////////////////////////////////////// SUBMIT REQUEST //////////////////////////////////////////////////
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user_email || !user_name) {
      alert("User is not logged in. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const form = new FormData();
      form.append("user_email", user_email);
      form.append("user_name", user_name);
      form.append("req_type", formData.type);
      form.append("req_details", formData.details);
      form.append("req_region", formData.region);

      const response = await fetch("http://localhost:8000/submit-request", {
        method: "POST",
        body: form,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Request submitted successfully!");
        setFormData({ region: "", details: "", type: "" });
      } else {
        alert(result.detail || "Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const isFormValid =
    formData.region && formData.details.trim() && formData.type;

  return (
    <div className="request-form-container">
      <div className="form-header">
        <h1>Submit a Request</h1>
        <p>Report incidents or request help in your region</p>
      </div>

      <form onSubmit={handleSubmit} className="request-form">
        {/* Region Field */}
        <div className="form-group">
          <label htmlFor="region" className="form-label">
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Region *
          </label>
          <select
            id="region"
            name="region"
            value={formData.region}
            onChange={handleInputChange}
            className="form-select"
            required
            disabled={isSubmitting}
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Field */}
        <div className="form-group">
          <label htmlFor="type" className="form-label">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Request Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="form-select"
            required
            disabled={isSubmitting}
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Details Field */}
        <div className="form-group">
          <label htmlFor="details" className="form-label">
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            Details *
          </label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleInputChange}
            placeholder={
              formData.type === "help"
                ? "Describe the help you need..."
                : formData.type === "report"
                ? "Describe the incident you're reporting..."
                : "Provide detailed information about your request..."
            }
            className="form-textarea"
            rows={6}
            required
            disabled={isSubmitting}
          />
          <div className="character-count">
            {formData.details.length}/500 characters
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn btn-primary btn-large ${!isFormValid ? "disabled" : ""}`}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="loading-spinner"></div>
              Submitting...
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Submit Request
            </>
          )}
        </button>

        {/* Form Info */}
        <div className="form-info">
          <p>
            <svg
              className="info-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            All fields marked with * are required.
          </p>
        </div>
      </form>
    </div>
  );
}

export default RequestForm;
