import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Save } from "lucide-react";
import "./TaskModal.css";

const CreateCategoryModal = ({
  onClose,
  onCategoryCreate,
  onCategoryUpdate,
  groupID = null,
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const modalRef = useRef(null);
  const nameInputRef = useRef(null);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const validateForm = () => {
    if (!categoryName.trim()) {
      setValidationError({ message: "Category name is required" });
      nameInputRef.current?.focus();
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (token && !groupID) {
        await api.post("/category", {
          category_name: categoryName,
          description: description,
          color: color,
        });
      }
      if (token && groupID) {
        await api.post(`/category/group/${groupID}`, {
          category_name: categoryName,
          description: description,
          color: color,
        });
      }

      if (onCategoryUpdate) {
        await onCategoryUpdate();
      }
      if (onCategoryCreate) {
        onCategoryCreate();
      }
      onClose();
    } catch (err) {
      console.error("Error creating category:", err);
      setError({
        message: "Failed to create category",
        details: err.response?.data?.error || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="task-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>Create New Category</h2>
          <div className="header-actions">
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
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

          <form onSubmit={handleSubmit}>
            <section className="basic-info">
              <h3>Basic Information</h3>
              <div className="form-group-cat">
                {validationError && (
                  <div className="error-message">
                    <p>{validationError.message}</p>
                  </div>
                )}
                <div className="info-grid">
                  <div>
                    <span className="info-label-cat">Name:</span>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className={`edit-input ${
                        validationError || error ? "error-input" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <span className="info-label-cat">Color:</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="edit-color"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="section-divider"></div>

            <section className="description">
              <h3>Description</h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="edit-textarea-mod"
              />
            </section>

            <div className="modal-footer">
              <div className="footer-actions">
                <button
                  className="action-btn close-edit-btn"
                  type="button"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  className="action-btn save-btn"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save size={14} /> Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

CreateCategoryModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCategoryCreate: PropTypes.func,
  onCategoryUpdate: PropTypes.func,
  groupID: PropTypes.number,
};

export default CreateCategoryModal;
