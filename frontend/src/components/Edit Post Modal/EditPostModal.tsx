"use client";
///////////// DONE BY ALI AHMED ABOUELSEOUD MOUSTAFA TAHA (TP069502) //////////////////////////////


import type React from "react";
import { useState, useEffect } from "react";
import "./EditPostModal.css";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  PostS3Key: string;
  initialTitle: string;
  initialDescription: string;
  onUpdate: (postId: string, title: string, description: string) => void;
  onDelete: (postId: string, PostS3Key: string) => void;
}

function EditPostModal({
  isOpen,
  onClose,
  postId,
  PostS3Key,
  initialTitle,
  initialDescription,
  onUpdate,
  onDelete,
}: EditPostModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isLoading, setIsLoading] = useState(false);
  //////////////////////////////////////////////////////////// Set the Initial Data ///////////////////////////////////////////////////////////////
  
  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    console.log(postId);
  }, [initialTitle, initialDescription]);

  //////////////////////////////////////////////////////////// Update Post Data ///////////////////////////////////////////////////////////////
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onUpdate(postId, title, description);
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  //////////////////////////////////////////////////////////// Delete Post ///////////////////////////////////////////////////////////////

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        await onDelete(postId, PostS3Key);
        onClose();
      } catch (error) {
        console.error("Error deleting post:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  //////////////////////////////////////////////////////////// UI ///////////////////////////////////////////////////////////////
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Post</h2>
          <button className="close-btn" onClick={onClose} disabled={isLoading}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleUpdate} className="edit-form">
          <div className="form-group">
            <label htmlFor="edit-title">Post Title</label>
            <input
              type="text"
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Post Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter post description"
              rows={6}
              required
              disabled={isLoading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="delete-btn"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Post"}
            </button>
            <div className="action-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button type="submit" className="update-btn" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPostModal;
