import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Save, Plus, Trash2, Edit, Check, ArrowLeft } from "lucide-react";
import "./ManagementModal.css";

const PriorityList = () => {
  const [priorities, setPriorities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    color: "#000000",
  });

  const fetchPriorities = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/priority");
      setPriorities(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching priorities:", err);
      setError("Failed to load priorities");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities();
  }, []);

  const handleDelete = async (priorityId) => {
    try {
      await api.delete(`/priority/delete/${priorityId}`);
      fetchPriorities();
    } catch (err) {
      console.error("Error deleting priority:", err);
      setError("Failed to delete priority");
    }
  };

  const startEditing = (priority) => {
    setEditingId(priority.priority_id);
    setEditForm({
      name: priority.priority_name,
      color: priority.color,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      color: "#000000",
    });
    setError(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm({
      ...editForm,
      [field]: value,
    });
  };

  const saveEditing = async () => {
    if (!editForm.name.trim()) {
      setError("Priority name is required");
      return;
    }

    try {
      setIsLoading(true);
      await api.put(`/priority/${editingId}`, {
        priority_name: editForm.name,
        color: editForm.color,
      });
      await fetchPriorities();
      cancelEditing();
      setError(null); // Clear error on success
    } catch (err) {
      console.error("Error updating priority:", err);
      setError(err.response?.data?.error || "Failed to update priority");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Priorities</h2>
        <button className="add-button" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Add Priority
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isLoading ? (
        <div className="loading">Loading priorities...</div>
      ) : (
        <div className="management-list">
          {priorities.map((priority) => (
            <div key={priority.priority_id} className="management-item">
              {editingId === priority.priority_id ? (
                <>
                  <div className="item-info">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      className="edit-input inline-edit"
                    />
                    <div className="color-picker">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) =>
                          handleEditChange("color", e.target.value)
                        }
                      />
                      <span>{editForm.color}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      className="save-btn1"
                      onClick={saveEditing}
                      disabled={isLoading}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={cancelEditing}
                      disabled={isLoading}
                    >
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="item-info">
                    <span>{priority.priority_name}</span>
                    <span
                      className="color-badge"
                      style={{ backgroundColor: priority.color }}
                    ></span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="edit-btn1"
                      onClick={() => startEditing(priority)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="delete-btn1"
                      onClick={() => handleDelete(priority.priority_id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePriorityModal
          onClose={() => {
            setShowCreateModal(false);
            setError(null); // Clear errors when closing modal
          }}
          onPriorityCreated={() => {
            fetchPriorities();
            setError(null); // Clear errors on successful creation
          }}
        />
      )}
    </div>
  );
};

// Create Priority Modal
const CreatePriorityModal = ({ onClose, onPriorityCreated }) => {
  const [priority, setPriority] = useState({
    name: "",
    color: "#000000",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!priority.name.trim()) {
      setError("Priority name is required");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/priority", {
        priority_name: priority.name,
        color: priority.color,
      });
      onPriorityCreated();
      onClose();
    } catch (err) {
      console.error("Error creating priority:", err);
      setError(err.response?.data?.error || "Failed to create priority");
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="management-modal">
        <div className="modal-header">
          <h2>Create New Priority</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Priority Name:</label>
            <input
              type="text"
              value={priority.name}
              onChange={(e) =>
                setPriority({ ...priority, name: e.target.value })
              }
              className={`edit-input ${error ? "error-input" : ""}`}
              placeholder="Enter priority name"
            />
          </div>

          <div className="form-group">
            <label>Color:</label>
            <div className="color-picker">
              <input
                type="color"
                value={priority.color}
                onChange={(e) =>
                  setPriority({ ...priority, color: e.target.value })
                }
              />
              <span>{priority.color}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="action-btn1 save-btn1"
            onClick={handleSubmit}
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
    </div>
  );
};

CreatePriorityModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onPriorityCreated: PropTypes.func.isRequired,
};

export default PriorityList;
