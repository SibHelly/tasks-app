import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Save } from "lucide-react";
import "./TaskModal.css";

const CreateSubtaskModal = ({ parentTaskId, onClose, onSubtaskCreate }) => {
  const [subtask, setSubtask] = useState({
    task_name: "",
    task_description: "",
    priority_id: "",
    status_id: "",
    parent_task_id: parentTaskId,
  });

  const [task, setTask] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Обработчики закрытия по клику вне и Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      const modal = document.querySelector(".subtask-modal");
      if (modal && !modal.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Загрузка справочных данных
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setIsLoading(true);

        const taskResponse = await api.get(`/tasks/get/${parentTaskId}`);
        setTask(taskResponse.data.tasks.task_name);

        // Загрузка приоритетов
        const prioritiesResponse = await api.get("/priority");
        setPriorities(
          prioritiesResponse.data.map((p) => ({
            id: p.priority_id,
            name: p.priority_name,
          }))
        );

        // Загрузка статусов
        const statusesResponse = await api.get("/statuses");
        setStatuses(
          statusesResponse.data.map((s) => ({
            id: s.status_id,
            name: s.status,
          }))
        );

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching reference data:", err);
        setError("Failed to load reference data");
        setIsLoading(false);
      }
    };

    fetchReferenceData();
  }, [parentTaskId]);

  const handleFieldChange = (field, value) => {
    setSubtask({
      ...subtask,
      [field]: value,
    });
    if (field === "task_name" && value) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!subtask.task_name.trim()) {
      setError("Task name is required");
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.post("/tasks/createSubtask", {
        ...subtask,
        priority_id: subtask.priority_id || null,
        status_id: subtask.status_id || null,
      });

      if (onSubtaskCreate) {
        await onSubtaskCreate(response.data);
      }

      onClose();
    } catch (err) {
      console.error("Error creating subtask:", err);
      setError(err.response?.data?.error || "Failed to create subtask");
      setIsLoading(false);
    }
  };

  if (isLoading && !priorities.length) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="subtask-modal">
        <div className="modal-header">
          <h2>Add New Subtask</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label>Parent task name: {task}</label>
            <label>Subtask Name:</label>
            <input
              type="text"
              value={subtask.task_name}
              onChange={(e) => handleFieldChange("task_name", e.target.value)}
              className={`edit-input ${error ? "error-input" : ""}`}
              placeholder="Enter subtask name"
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={subtask.task_description}
              onChange={(e) =>
                handleFieldChange("task_description", e.target.value)
              }
              className="edit-textarea"
              placeholder="Enter subtask description..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority:</label>
              <select
                value={subtask.priority_id}
                onChange={(e) =>
                  handleFieldChange(
                    "priority_id",
                    parseInt(e.target.value) || ""
                  )
                }
                className="edit-select"
              >
                <option value="">Select Priority</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status:</label>
              <select
                value={subtask.status_id}
                onChange={(e) =>
                  handleFieldChange("status_id", parseInt(e.target.value) || "")
                }
                className="edit-select"
              >
                <option value="">Select Status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            <button
              className="action-btn save-btn"
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
    </div>
  );
};

CreateSubtaskModal.propTypes = {
  parentTaskId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubtaskCreate: PropTypes.func,
};

export default CreateSubtaskModal;
