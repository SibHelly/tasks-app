import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Edit, Trash2, Save } from "lucide-react";
import "./TaskModal.css";

const SubtaskModal = ({ taskId, onClose, onEdit, onTaskUpdate }) => {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editedTask, setEditedTask] = useState(null);
  const [group, setGroup] = useState("");

  // Ref for the modal content
  const modalRef = useRef(null);

  // Handle click outside of modal
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Handle Escape key press
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  // Add and remove event listeners
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (token) {
          // Load main task data
          const taskResponse = await api.get(`/tasks/get/${taskId}`);
          const taskData = taskResponse.data.tasks;
          setTask(taskData);

          // Initialize edited task with proper IDs
          setEditedTask({
            ...taskData,
            priority_id: taskData.priority?.priority_id,
            status_id: taskData.status?.status_id,
            category_id: taskData.category?.category_id,
          });

          // Load additional data for editing
          const prioritiesResponse = await api.get("/priority");
          setPriorities(
            prioritiesResponse.data.map((p) => ({
              id: p.priority_id,
              name: p.priority_name,
              color: p.color,
            }))
          );

          const statusesResponse = await api.get("/statuses");
          setStatuses(
            statusesResponse.data.map((s) => ({
              id: s.status_id,
              name: s.status,
            }))
          );

          // Check if task belongs to a group and load group name
          if (taskData.group_id && taskData.group_id !== 0) {
            // Fetch group name
            const groupResponse = await api.get(`/group/${taskData.group_id}`);
            setGroup(groupResponse.data.group.group_name || "Unknown group");

            // For group tasks, load categories specific to the group
            const groupCategoriesResponse = await api.get(
              `/category/group/${taskData.group_id}`
            );
            setCategories(
              groupCategoriesResponse.data.map((c) => ({
                id: c.category_id,
                name: c.category_name,
                color: c.color,
              }))
            );
          } else {
            // For non-group tasks, load default categories
            const categoriesResponse = await api.get("/category");
            setCategories(
              categoriesResponse.data.map((c) => ({
                id: c.category_id,
                name: c.category_name,
                color: c.color,
              }))
            );
          }
        }

        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error("Error fetching task data:", err);
        setError({
          message: "Failed to load task data",
          details: err.response?.data?.message || err.message,
        });
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset changes when canceling edit
      setEditedTask({
        ...task,
        priority_id: task.priority?.priority_id,
        status_id: task.status?.status_id,
        category_id: task.category?.category_id,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field, value) => {
    setEditedTask({
      ...editedTask,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await api.put(`/tasks/update/${taskId}`, {
        ...editedTask,
        priority_id: editedTask.priority_id,
        status_id: editedTask.status_id,
        category_id: editedTask.category_id,
      });

      const updatedTask = {
        ...task,
        ...editedTask,
        priority: priorities.find((p) => p.id === editedTask.priority_id),
        status: statuses.find((s) => s.id === editedTask.status_id),
        category: categories.find((c) => c.id === editedTask.category_id)?.name,
      };

      setTask(updatedTask);
      setIsEditing(false);
      setIsLoading(false);
      localStorage.setItem("update", "yes");

      // Вызываем функцию обновления списка задач в родительском компоненте
      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError({
        message: "Failed to update task",
        details: err.response.data.error,
      });
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setIsLoading(true);

      // Отправляем запрос на удаление задачи
      await api.delete(`/tasks/delete/${taskId}`);

      // Очищаем локальное состояние (если нужно)
      setTask(null);
      setIsLoading(false);
      localStorage.setItem("update", "yes");

      // Вызываем функцию обновления списка задач в родительском компоненте
      if (onTaskUpdate) {
        await onTaskUpdate();
      }

      // Если это модальное окно - закрываем его
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setError({
        message: "Failed to delete task",
        details: err.response.data.error,
      });
      setIsLoading(false);

      // Дополнительно: можно показать уведомление об ошибке
      alert("Ошибка при удалении задачи");
    }
  };

  const formatDate = (dateString) => {
    if (dateString === "0001-01-01T00:00:00Z") return "Not specified";
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityText = (priorityId) => {
    const priority = priorities.find((p) => p.id === priorityId);
    return priority ? priority.name : "Not specified";
  };

  const getCategoryText = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Not specified";
  };

  const getStatusText = (statusId) => {
    const status = statuses.find((s) => s.id === statusId);
    return status ? status.name : "Not specified";
  };

  if (isLoading) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-loading">Loading task data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-error">Error: {error.message}</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-error">Task not found</div>
      </div>
    );
  }

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="task-modal" ref={modalRef}>
        <div className="modal-header">
          {isEditing ? (
            <input
              type="text"
              value={editedTask.task_name || ""}
              onChange={(e) => handleFieldChange("task_name", e.target.value)}
              className="edit-input"
            />
          ) : (
            <h2>{task.task_name}</h2>
          )}
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
        </div>

        <div className="modal-content">
          <section className="basic-info">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div>
                <span className="info-label">Priority:</span>
                {isEditing ? (
                  <select
                    value={editedTask.priority_id || ""}
                    onChange={(e) =>
                      handleFieldChange("priority_id", parseInt(e.target.value))
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
                ) : (
                  <span className={`priority-${task.priority?.priority_name}`}>
                    {getPriorityText(task.priority_id)}
                  </span>
                )}
              </div>
              <div>
                <span className="info-label">Status:</span>
                {isEditing ? (
                  <select
                    value={editedTask.status_id || ""}
                    onChange={(e) =>
                      handleFieldChange("status_id", parseInt(e.target.value))
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
                ) : (
                  <span>{getStatusText(task.status_id)}</span>
                )}
              </div>
              <div>
                <span className="info-label">Category:</span>
                {isEditing ? (
                  <select
                    value={
                      editedTask.category_id || task.category?.category_id || ""
                    }
                    onChange={(e) =>
                      handleFieldChange("category_id", parseInt(e.target.value))
                    }
                    className="edit-select"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{getCategoryText(task.category_id)}</span>
                )}
              </div>
              <div>
                <span className="info-label">Group:</span>
                <span>{group || "Not a group task"}</span>
              </div>
            </div>
          </section>

          <div className="section-divider"></div>

          <section className="time-info">
            <h3>Time Information</h3>
            <div className="time-grid">
              <div>
                <span className="info-label">Start Time:</span>
                <span>{formatDate(task.start_time)}</span>
              </div>
              <div>
                <span className="info-label">End Time:</span>
                <span>{formatDate(task.end_time)}</span>
              </div>
            </div>
          </section>

          <div className="section-divider"></div>

          <section className="description">
            <h3>Description</h3>
            {isEditing ? (
              <textarea
                value={editedTask.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                className="edit-textarea"
              />
            ) : (
              <p>{task.description || "No description provided"}</p>
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
                  Close
                </button>
                <button className="action-btn save-btn" onClick={handleSave}>
                  <Save size={14} /> Save
                </button>
              </>
            ) : (
              <button
                className="action-btn delete-btn"
                onClick={handleDeleteTask}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

SubtaskModal.propTypes = {
  taskId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onTaskUpdate: PropTypes.func,
};

export default SubtaskModal;
