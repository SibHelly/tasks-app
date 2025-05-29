import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Save, Plus, Trash2, Edit, Check, ArrowLeft } from "lucide-react";
import "./ManagementModal.css";

const StatusList = () => {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchStatuses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/statuses");
      setStatuses(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching statuses:", err);
      setError("Failed to load statuses");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleDelete = async (statusId) => {
    try {
      await api.delete(`/statuses/${statusId}`);
      fetchStatuses();
      setError(null); // Clear error on success
    } catch (err) {
      console.error("Error deleting status:", err);
      setError("Failed to delete status");
    }
  };

  const startEditing = (status) => {
    setEditingId(status.status_id);
    setEditName(status.status);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setError(null);
  };

  const saveEditing = async () => {
    if (!editName.trim()) {
      setError("Status name is required");
      return;
    }

    try {
      setIsLoading(true);
      await api.put(`/statuses/${editingId}`, {
        status: editName,
      });
      await fetchStatuses();
      cancelEditing();
      setError(null); // Clear error on success
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Statuses</h2>
        <button className="add-button" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Add Status
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isLoading ? (
        <div className="loading">Loading statuses...</div>
      ) : (
        <div className="management-list">
          {statuses.map((status) => (
            <div key={status.status_id} className="management-item">
              {editingId === status.status_id ? (
                <>
                  <div className="item-info">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="edit-input inline-edit"
                    />
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
                    <span>{status.status}</span>
                  </div>
                  <div className="item-actions">
                    {status.status !== "Done" && (
                      <>
                        <button
                          className="edit-btn1"
                          onClick={() => startEditing(status)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="delete-btn1"
                          onClick={() => handleDelete(status.status_id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateStatusModal
          onClose={() => {
            setShowCreateModal(false);
            setError(null); // Clear errors when closing modal
          }}
          onStatusCreated={() => {
            fetchStatuses();
            setError(null); // Clear errors on successful creation
          }}
        />
      )}
    </div>
  );
};

const CreateStatusModal = ({ onClose, onStatusCreated }) => {
  const [statusName, setStatusName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!statusName.trim()) {
      setError("Status name is required");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/statuses", { status: statusName });
      onStatusCreated();
      onClose();
    } catch (err) {
      console.error("Error creating status:", err);
      setError(err.response?.data?.error || "Failed to create status");
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="management-modal">
        <div className="modal-header">
          <h2>Create New Status</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Status Name:</label>
            <input
              type="text"
              value={statusName}
              onChange={(e) => setStatusName(e.target.value)}
              className={`edit-input ${error ? "error-input" : ""}`}
              placeholder="Enter status name"
            />
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

CreateStatusModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onStatusCreated: PropTypes.func.isRequired,
};

export default StatusList;
