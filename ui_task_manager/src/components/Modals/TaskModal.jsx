import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import {
  X,
  Edit,
  Plus,
  MessageSquare,
  Trash2,
  Save,
  Calendar,
} from "lucide-react";
import SubtaskList from "../Lists/SubtaskList";
import "./TaskModal.css";
import CreateChatModal from "./CreateChatModal"; // Fixed import name
import ChatListModal from "./ChatListModal";
import ChatModal from "./ChatModal";

const TaskModal = ({
  taskId,
  onClose,
  onEdit,
  onTaskUpdate,
  onChatUpdate,
  onCreateSubtask,
  hidden,
}) => {
  // State for task data
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editedTask, setEditedTask] = useState(null);
  const [group, setGroup] = useState("");
  const [groupId, setGroupId] = useState(0);

  const [showCreateChatModal, setShowCreateChatModal] = useState(false);
  const [showChatListModal, setShowChatListModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [taskChats, setTaskChats] = useState([]);

  // Ref for the modal content
  const modalRef = useRef(null);

  // Handle Escape key press
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  // Add and remove event listeners
  useEffect(() => {
    // Only add listeners if modal is visible
    if (!hidden) {
      document.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, onClose]);

  // eslint-disable-next-line no-unused-vars
  const handleOpenChatList = async () => {
    try {
      // Загружаем чаты для текущей задачи
      const response = await api.get(`/chats/task/${taskId}`);
      setTaskChats(response.data.Chats || []);
      setShowChatListModal(true);
    } catch (err) {
      console.error("Error fetching task chats:", err);
      alert("Failed to load task discussions");
    }
  };

  const handleChatDeleted = (chatId) => {
    // Обновляем локальный список чатов
    setTaskChats(taskChats.filter((chat) => chat.chat_id !== chatId));

    // Вызываем родительскую функцию для обновления чатов в GroupModal
    if (onChatUpdate) {
      onChatUpdate();
    }
  };
  // Load all required data
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (token) {
          // Load main task
          const taskResponse = await api.get(`/tasks/get/${taskId}`);
          setTask(taskResponse.data.tasks);
          setEditedTask(taskResponse.data.tasks);
          setGroupId(taskResponse.data.tasks.group_id);

          // Load subtasks
          const subtasksResponse = await api.get(
            `/tasks/get/subtasks/${taskId}`
          );
          setSubtasks(subtasksResponse.data.tasks);

          // Load priorities
          const prioritiesResponse = await api.get("/priority");
          setPriorities(
            prioritiesResponse.data.map((p) => ({
              id: p.priority_id,
              priority_name: p.priority_name,
              color: p.color,
            }))
          );

          // Load statuses
          const statusesResponse = await api.get("/statuses");
          setStatuses(
            statusesResponse.data.map((s) => ({
              id: s.status_id,
              status: s.status,
            }))
          );

          // Check if task belongs to a group and load group name
          if (
            taskResponse.data.tasks.group_id &&
            taskResponse.data.tasks.group_id !== 0
          ) {
            // Fetch group name
            const groupResponse = await api.get(
              `/group/${taskResponse.data.tasks.group_id}`
            );
            setGroup(groupResponse.data.group.group_name || "Unknown group");

            // For group tasks, load categories specific to the group
            const groupCategoriesResponse = await api.get(
              `/category/group/${taskResponse.data.tasks.group_id}`
            );
            setCategories(
              groupCategoriesResponse.data.map((c) => ({
                id: c.category_id,
                name: c.category_name,
                description: c.description,
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
                description: c.description,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (groupId !== 0) {
      fetchCurrentUserRole();
    }
  });

  const [currentUserRole, setCurrentUserRole] = useState("");

  const fetchCurrentUserRole = async () => {
    try {
      const response = await api.get(`/group/${task.group_id}/role`);
      setCurrentUserRole(response.data.role);
    } catch (err) {
      console.error("Error fetching current user role:", err);
      setCurrentUserRole("member");
    }
  };
  // Function to refresh subtasks
  const refreshSubtasks = async () => {
    try {
      const subtasksResponse = await api.get(`/tasks/get/subtasks/${taskId}`);
      setSubtasks(subtasksResponse.data.tasks);
    } catch (err) {
      console.error("Error refreshing subtasks:", err);
    }
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setEditedTask({
      ...editedTask,
      [field]: value,
    });
  };

  // Save edited task
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const taskData = {
        task_name: editedTask.task_name,
        task_description: editedTask.description,
        priority_id: editedTask.priority_id ? editedTask.priority_id : null,
        status_id: editedTask.status_id ? editedTask.status_id : null,
        start_time: editedTask.start_time
          ? new Date(editedTask.start_time).toISOString()
          : null,
        end_time: editedTask.end_time
          ? new Date(editedTask.end_time).toISOString()
          : null,
        category_id: editedTask.category_id ? editedTask.category_id : null,
        parent_task_id: editedTask.parent_task_id,
        group_id: editedTask.group || 0,
      };
      await api.put(`/tasks/update/${taskId}`, taskData);
      setTask(taskData);
      setIsEditing(false);
      localStorage.setItem("update", "yes");

      // Call the function to update task list in parent component
      if (onTaskUpdate) {
        await onTaskUpdate();
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error updating task:", err);
      setError({
        message: "Failed to update task",
        details: err.response?.data?.error,
      });
      setIsLoading(false);
    }
  };

  // Format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  // Action handlers
  const handleAddSubtask = () => {
    // If we have a dedicated onCreateSubtask handler from parent
    if (onCreateSubtask) {
      onCreateSubtask(taskId);
    } else if (onEdit) {
      // Fallback to legacy method
      onEdit(taskId, 0, true);
    } else {
      // If neither handlers are available, dispatch a custom event
      // This integrates with GroupModal's event listener
      const event = new CustomEvent("addSubtask", {
        detail: { taskId: taskId },
      });
      document.dispatchEvent(event);
      onClose(); // Close this modal as the parent will open the subtask creation modal
    }
  };

  const handleStartDiscussion = () => {
    setShowCreateChatModal(true);
  };

  const handleViewDiscussions = async () => {
    try {
      const response = await api.get(`/chats/task/${taskId}`);
      setTaskChats(response.data.Chats || []);
      setShowChatListModal(true);
    } catch (err) {
      console.error("Error fetching task chats:", err);
      alert("Failed to load discussions");
    }
  };

  const handleChatCreated = (chat) => {
    setShowCreateChatModal(false);
    setSelectedChatId(chat.chat_id);
    setShowChatModal(true);
    // Update the chats list with the new chat
    setTaskChats((prevChats) => [...prevChats, chat]);

    if (onChatUpdate) {
      onChatUpdate();
    }
  };

  const handleChatSelect = (chatId) => {
    setShowChatListModal(false); // Закрываем список чатов
    setSelectedChatId(chatId); // Устанавливаем выбранный чат
    setShowChatModal(true); // Открываем модальное окно чата
  };
  const handleDeleteTask = async () => {
    try {
      setIsLoading(true);

      // Send request to delete task
      await api.delete(`/tasks/delete/${taskId}`);

      // Clear local state
      setTask(null);
      setIsLoading(false);
      localStorage.setItem("update", "yes");

      // Call the function to update task list in parent component
      if (onTaskUpdate) {
        await onTaskUpdate();
      }

      // Close modal if needed
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setError({
        message: "Failed to delete task",
        details: err.response?.data?.error,
      });
      setIsLoading(false);

      // Show error notification
      alert("Error deleting task");
    }
  };

  // Date formatting
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
    return priority ? priority.priority_name : "Not specified";
  };

  // Get category name by ID
  const getCategoryText = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Not specified";
  };

  // Get status name by ID
  const getStatusText = (statusId) => {
    const status = statuses.find((s) => s.id === statusId);
    return status ? status.status : "Not specified";
  };

  // eslint-disable-next-line no-unused-vars
  const handleChatClosed = () => {
    setShowChatModal(false);
    // После закрытия чата снова показываем список чатов
    setShowChatListModal(true);
  };

  // Loading and error states
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
              value={editedTask.task_name || ""}
              onChange={(e) => handleFieldChange("task_name", e.target.value)}
              className="edit-input"
            />
          ) : (
            <h2>{task.task_name}</h2>
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
                        {priority.priority_name}
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
                        {status.status}
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
            {isEditing ? (
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time:</label>
                  <div className="date-input-container">
                    <Calendar size={16} className="date-icon" />
                    <input
                      type="datetime-local"
                      value={formatDateForInput(editedTask.start_time)}
                      onChange={(e) =>
                        handleFieldChange("start_time", e.target.value)
                      }
                      className="date-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>End Time:</label>
                  <div className="date-input-container">
                    <Calendar size={16} className="date-icon" />
                    <input
                      type="datetime-local"
                      value={formatDateForInput(editedTask.end_time)}
                      onChange={(e) =>
                        handleFieldChange("end_time", e.target.value)
                      }
                      className="date-input"
                    />
                  </div>
                </div>
              </div>
            ) : (
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
            )}
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

          {!isEditing && task.parent_task_id === 0 && (
            <>
              <div className="section-divider"></div>
              <section className="subtasks">
                <h3>Subtasks</h3>
                <SubtaskList
                  tasks={subtasks}
                  onTaskSelect={(taskId) =>
                    onEdit && onEdit(taskId, task.task_id)
                  }
                  onTaskUpdate={refreshSubtasks}
                  groupId={task.group_id}
                />

                {currentUserRole !== "member" && (
                  <button
                    className="action-btn add-subtask-btn"
                    onClick={handleAddSubtask}
                  >
                    <Plus size={16} /> Add Subtask
                  </button>
                )}
              </section>
            </>
          )}
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
              <>
                {task.group_id !== 0 && (
                  <>
                    <button
                      className="action-btn view-discussions-btn"
                      onClick={handleViewDiscussions}
                    >
                      <MessageSquare size={14} /> View
                    </button>
                    <button
                      className="action-btn start-discussion-btn"
                      onClick={handleStartDiscussion}
                    >
                      <MessageSquare size={14} /> Start
                    </button>
                  </>
                )}
                {currentUserRole !== "member" && (
                  <button
                    className="action-btn delete-btn"
                    onClick={handleDeleteTask}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {showCreateChatModal && (
        <CreateChatModal
          groupId={task.group_id}
          taskId={taskId}
          onClose={() => setShowCreateChatModal(false)}
          onChatCreated={handleChatCreated}
        />
      )}
      {showChatListModal && (
        <ChatListModal
          chats={taskChats}
          onClose={() => setShowChatListModal(false)}
          onChatSelect={handleChatSelect}
          groupId={groupId}
          onChatDeleted={handleChatDeleted}
          currentUserRole={currentUserRole} // Передаем роль
        />
      )}

      {showChatModal && selectedChatId && (
        <ChatModal
          chatId={selectedChatId}
          onClose={() => setShowChatModal(false)} // Просто закрываем окно чата
          onChatDeleted={handleChatDeleted}
          currentUserRole={currentUserRole} // Передаем роль
        />
      )}
    </div>
  );
};

TaskModal.propTypes = {
  taskId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onTaskUpdate: PropTypes.func,
  onCreateSubtask: PropTypes.func,
  hidden: PropTypes.bool,
};

export default TaskModal;
