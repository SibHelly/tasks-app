import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Edit, Save, Trash2 } from "lucide-react";
import "./TaskModal.css";

const CategoryModal = ({
  categoryId,
  onClose,
  onCategoryUpdate,
  hidden,
  group_id = 0,
}) => {
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCategory, setEditedCategory] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (group_id !== 0) {
      fetchCurrentUserRole();
    }
  });

  const [currentUserRole, setCurrentUserRole] = useState("");

  const fetchCurrentUserRole = async () => {
    try {
      const response = await api.get(`/group/${group_id}/role`);
      setCurrentUserRole(response.data.role);
    } catch (err) {
      console.error("Error fetching current user role:", err);
      setCurrentUserRole("member");
    }
  };

  const modalRef = useRef(null);
  const nameInputRef = useRef(null);

  const handleClickOutside = (event) => {
    setError(null);
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  const handleKeyDown = (event) => {
    setError(null);
    if (event.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    if (!hidden) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, onClose]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (token) {
          const response = await api.get(`/category/${categoryId}`);
          if (!response.data || !response.data.category) {
            throw new Error("Category data is invalid");
          }
          setCategory(response.data.category);
          setEditedCategory(response.data.category);
        }

        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError({
          message: "Failed to load category data",
          details: err.response?.data?.error,
        });
        setIsLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryId]);

  const handleEditToggle = () => {
    setError(null);
    setIsEditing(!isEditing);
    setValidationError(null);
    if (!isEditing && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 0);
    }
  };

  const handleFieldChange = (field, value) => {
    setError(null);
    setEditedCategory({
      ...editedCategory,
      [field]: value,
    });
    if (field === "category_name" && value) {
      setValidationError(null);
    }
  };

  const validateForm = () => {
    setError(null);
    if (!editedCategory.category_name?.trim()) {
      setValidationError({ message: "Category name is required" });
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.put(`/category/${categoryId}`, editedCategory);

      setCategory(editedCategory);
      setIsEditing(false);
      localStorage.setItem("update", "yes");

      if (onCategoryUpdate) {
        await onCategoryUpdate();
      }
    } catch (err) {
      console.error("Error updating category:", err);
      setError({
        message: "Failed to update category",
        details: err.response?.data?.error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await api.delete(`/category/delete/${categoryId}`);
      localStorage.setItem("update", "yes");

      if (onCategoryUpdate) {
        await onCategoryUpdate();
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      setError({
        message: "Failed to delete category",
        details: err.response?.data?.error || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-loading">Loading category data...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-error">
          <p>Category not found</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (hidden) {
    return null;
  }

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="task-modal" ref={modalRef}>
        <div className="modal-header">
          {isEditing ? (
            <input
              type="text"
              value={category.category_name || ""}
              onChange={(e) => handleFieldChange("task_name", e.target.value)}
              className="edit-input"
            />
          ) : (
            <h2>{category.category_name}</h2>
          )}
          {currentUserRole !== "member" ? (
            <div className="header-actions">
              {!isEditing && (
                <button
                  className="edit-header-btn"
                  onClick={handleEditToggle}
                  aria-label="Edit task"
                >
                  <Edit size={18} />
                </button>
              )}
              <button
                className="close-button"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="header-actions">
              <button
                className="close-button"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              <p>{error.message}</p>
              {error.details && (
                <p className="error-details">{error.details}</p>
              )}
            </div>
          )}

          {isEditing && (
            <div className="form-group">
              {validationError && (
                <div className="error-message">
                  <p>{validationError.message}</p>
                </div>
              )}
              <input
                ref={nameInputRef}
                type="text"
                value={editedCategory.category_name || ""}
                onChange={(e) =>
                  handleFieldChange("category_name", e.target.value)
                }
                className={`edit-input ${validationError ? "error-input" : ""}`}
              />
            </div>
          )}

          <section className="basic-info">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div>
                <span className="info-label">Color:</span>
                {isEditing ? (
                  <input
                    type="color"
                    value={editedCategory.color || "#ffffff"}
                    onChange={(e) => handleFieldChange("color", e.target.value)}
                    className="edit-color"
                  />
                ) : (
                  <span>
                    <div
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        backgroundColor: category.color,
                        verticalAlign: "middle",
                        marginRight: "5px",
                      }}
                    ></div>
                    {category.color}
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="section-divider"></div>

          <section className="description">
            <h3>Description</h3>
            {isEditing ? (
              <textarea
                value={editedCategory.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                className="edit-textarea"
              />
            ) : (
              <p>{category.description || "No description provided"}</p>
            )}
          </section>
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            {isEditing ? (
              <>
                <button
                  className="action-btn close-edit-btn"
                  onClick={handleEditToggle}
                >
                  Cancel
                </button>
                <button
                  className="action-btn save-btn"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={14} /> Save
                    </>
                  )}
                </button>
              </>
            ) : (
              currentUserRole !== "member" && (
                <button
                  className="action-btn delete-btn"
                  onClick={handleDeleteCategory}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 size={14} /> Delete
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CategoryModal.propTypes = {
  categoryId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onCategoryUpdate: PropTypes.func,
  hidden: PropTypes.bool,
};

export default CategoryModal;
