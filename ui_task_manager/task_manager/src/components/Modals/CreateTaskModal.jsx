import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { X, Calendar, Save, Plus, User } from "lucide-react";
import "./TaskModal.css";

const CreateTaskModal = ({
  onClose,
  onTaskCreate,
  onTaskUpdate,
  parentTaskId = 0,
  hidden,
  group = 0,
  end_time = "",
}) => {
  // State for new task data
  const [newTask, setNewTask] = useState({
    task_name: "",
    description: "",
    priority_id: "",
    status_id: "",
    category_id: "",
    group: group,
    start_time: "",
    end_time: end_time,
    parent_task_id: parentTaskId,
    subtasks: [],
    responsible_users: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [currentSubtask, setCurrentSubtask] = useState({
    task_name: "",
    description: "",
    priority_id: "",
    status_id: "",
  });
  const [subtaskError, setSubtaskError] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [availableResponsible, setAvailableResponsible] = useState([]);
  const [selectedResponsible, setSelectedResponsible] = useState("");
  useEffect(() => {
    const handleClickOutside = (event) => {
      const modal = document.querySelector(".task-modal");
      const subtaskModal = document.querySelector(".subtask-modal");

      // Если клик вне основного модального окна и вне окна подзадачи
      if (
        modal &&
        !modal.contains(event.target) &&
        (!subtaskModal || !subtaskModal.contains(event.target))
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (showSubtaskModal) {
          setShowSubtaskModal(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, showSubtaskModal]);

  // Load all required data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (token) {
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

          // Load categories
          const categoriesResponse = await api.get("/category");
          setCategories(
            categoriesResponse.data.map((c) => ({
              id: c.category_id,
              name: c.category_name,
              description: c.description,
              color: c.color,
            }))
          );

          // If it's a group task, load group members
          if (group) {
            // Get group info
            const groupResponse = await api.get(`/group/${group}`);
            setGroupInfo(groupResponse.data.group);

            // Get group members
            const membersResponse = await api.get(`/group/${group}/users`);
            const membersWithDetails = await Promise.all(
              membersResponse.data.users.map(async (member) => {
                const details = await api.post("/user", {
                  user_id: member.member_id,
                });
                return { ...member, ...details.data.user };
              })
            );
            setGroupMembers(membersWithDetails);
            setAvailableResponsible(membersWithDetails);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching reference data:", err);
        setError({
          message: "Failed to load reference data",
          details: err.response?.data?.message || err.message,
        });
        setIsLoading(false);
      }
    };

    fetchReferenceData();
  }, [group]);

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setNewTask({
      ...newTask,
      [field]: value,
    });
    // Clear error when user starts typing in task name
    if (field === "task_name" && value) {
      setError(null);
    }
  };

  // Handle subtask field changes
  const handleSubtaskFieldChange = (field, value) => {
    setCurrentSubtask({
      ...currentSubtask,
      [field]: value,
    });
    // Clear error when user starts typing in subtask name
    if (field === "task_name" && value) {
      setSubtaskError(null);
    }
  };

  // Add new subtask
  const handleAddSubtask = () => {
    if (!currentSubtask.task_name.trim()) {
      setSubtaskError({ message: "Subtask name is required" });
      return;
    }

    setNewTask({
      ...newTask,
      subtasks: [
        ...newTask.subtasks,
        {
          task_name: currentSubtask.task_name,
          description: currentSubtask.description,
          priority_id: currentSubtask.priority_id,
          status_id: currentSubtask.status_id,
        },
      ],
    });

    setCurrentSubtask({
      task_name: "",
      description: "",
      priority_id: "",
      status_id: "",
    });
    setSubtaskError(null);
    setShowSubtaskModal(false);
  };

  // Remove subtask
  const handleRemoveSubtask = (index) => {
    const updatedSubtasks = [...newTask.subtasks];
    updatedSubtasks.splice(index, 1);
    setNewTask({
      ...newTask,
      subtasks: updatedSubtasks,
    });
  };

  useEffect(() => {
    if (group) {
      const available = groupMembers.filter(
        (member) =>
          !newTask.responsible_users.some(
            (resp) => resp.member_id === member.member_id
          )
      );
      setAvailableResponsible(available);
    }
  }, [newTask.responsible_users, groupMembers, group]);

  const handleAddResponsible = () => {
    if (!selectedResponsible) return;

    const userToAdd = groupMembers.find(
      (member) => member.member_id.toString() === selectedResponsible
    );

    // Get current responsible users or empty array if undefined
    const currentResponsibleUsers = newTask.responsible_users || [];

    if (
      userToAdd &&
      !currentResponsibleUsers.some(
        (resp) => resp.member_id === userToAdd.member_id
      )
    ) {
      setNewTask({
        ...newTask,
        responsible_users: [...currentResponsibleUsers, userToAdd],
      });
      setSelectedResponsible("");
    }
  };

  // Remove responsible user
  const handleRemoveResponsible = (memberId) => {
    setNewTask({
      ...newTask,
      responsible_users: newTask.responsible_users.filter(
        (user) => user.member_id !== memberId
      ),
    });
  };

  // Save new task
  const handleSave = async () => {
    try {
      if (!newTask.task_name.trim()) {
        setError({ message: "Task name is required" });
        return;
      }

      setIsLoading(true);

      // Prepare data for API
      const taskData = {
        task_name: newTask.task_name,
        task_description: newTask.description,
        priority_id: newTask.priority_id ? newTask.priority_id : null,
        status_id: newTask.status_id ? newTask.status_id : null,
        start_time: newTask.start_time
          ? new Date(newTask.start_time).toISOString()
          : null,
        end_time: newTask.end_time
          ? new Date(newTask.end_time).toISOString()
          : null,
        category_id: newTask.category_id ? newTask.category_id : null,
        parent_task_id: newTask.parent_task_id,
        group_id: newTask.group || 0,
        responsible_users_id:
          newTask.responsible_users?.map((user) => ({
            responsible_id: user.id,
          })) || [],
        subtasks: newTask.subtasks.map((subtask) => ({
          task_name: subtask.task_name,
          description: subtask.description,
          priority_id: subtask.priority_id ? subtask.priority_id : null,
          status_id: subtask.status_id ? subtask.status_id : null,
        })),
      };
      const response = await api.post("/tasks/create", taskData);

      setIsLoading(false);

      if (onTaskUpdate) {
        await onTaskUpdate();
      }

      if (onTaskCreate) {
        await onTaskCreate(response.data);
      }

      onClose();
      localStorage.setItem("update", "yes");
    } catch (err) {
      console.error("Error creating task:", err);
      setError({
        message: "Failed to create task",
        details: err.response?.data?.error || err.message,
      });
      setIsLoading(false);
    }
  };

  // Format date for input fields
  function formatDateForInput(date) {
    if (!date) return "";

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  if (isLoading && !newTask) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-loading">Loading...</div>
      </div>
    );
  }

  if (hidden) {
    return null;
  }

  return (
    <div className="modal-overlay modal-overlay-blur">
      {/* Subtask Creation Modal */}
      {showSubtaskModal && (
        <div className="subtask-modal">
          <div className="modal-header">
            <h2>Add New Subtask</h2>
            <div className="header-actions">
              <button
                className="close-button"
                onClick={() => {
                  setShowSubtaskModal(false);
                  setSubtaskError(null);
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="modal-content">
            {subtaskError && (
              <div className="error-message">
                <p>{subtaskError.message}</p>
              </div>
            )}

            <div className="form-group">
              <label>Subtask Name:</label>
              <input
                type="text"
                value={currentSubtask.task_name}
                onChange={(e) =>
                  handleSubtaskFieldChange("task_name", e.target.value)
                }
                className={`edit-input ${subtaskError ? "error-input" : ""}`}
                placeholder="Enter subtask name"
                required
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={currentSubtask.description}
                onChange={(e) =>
                  handleSubtaskFieldChange("description", e.target.value)
                }
                className="edit-textarea-mod"
                placeholder="Enter subtask description..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={currentSubtask.priority_id}
                  onChange={(e) =>
                    handleSubtaskFieldChange(
                      "priority_id",
                      parseInt(e.target.value)
                    )
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
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={currentSubtask.status_id}
                  onChange={(e) =>
                    handleSubtaskFieldChange(
                      "status_id",
                      parseInt(e.target.value)
                    )
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
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-actions">
              <button
                className="action-btn close-edit-btn"
                onClick={() => {
                  setShowSubtaskModal(false);
                  setSubtaskError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="action-btn save-btn"
                onClick={handleAddSubtask}
              >
                <Save size={14} /> Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Task Creation Modal */}
      <div className="task-modal">
        <div className="modal-header">
          <h2>
            {group && groupInfo
              ? `Create task for group: ${groupInfo.group_name}`
              : parentTaskId > 0
              ? "Create New Subtask"
              : "Create New Task"}
          </h2>
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
          <section className="basic-info">
            {error && (
              <div className="error-message">
                <p>{error.message}</p>
                {error.details && (
                  <p className="error-details">{error.details}</p>
                )}
              </div>
            )}
            <h3>Basic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-name">Task Name:</label>
                <input
                  id="task-name"
                  type="text"
                  value={newTask.task_name}
                  onChange={(e) =>
                    handleFieldChange("task_name", e.target.value)
                  }
                  className={`task-name-input ${
                    error?.message === "Task name is required"
                      ? "error-input"
                      : ""
                  }`}
                  placeholder="Enter task name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={newTask.priority_id}
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
                      {priority.priority_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select
                  value={newTask.status_id}
                  onChange={(e) =>
                    handleFieldChange(
                      "status_id",
                      parseInt(e.target.value) || ""
                    )
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
              </div>

              <div className="form-group">
                <label>Category:</label>
                <select
                  value={newTask.category_id}
                  onChange={(e) =>
                    handleFieldChange(
                      "category_id",
                      parseInt(e.target.value) || ""
                    )
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
              </div>
            </div>
          </section>

          <div className="section-divider"></div>

          <section className="time-info">
            <h3>Time Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time:</label>
                <div className="date-input-container">
                  <Calendar size={16} className="date-icon" />
                  <input
                    type="datetime-local"
                    value={formatDateForInput(newTask.start_time)}
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
                    value={formatDateForInput(newTask.end_time)}
                    onChange={(e) => {
                      handleFieldChange("end_time", e.target.value);
                      console.log(e.target.value);
                    }}
                    className="date-input"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="section-divider"></div>

          <section className="description">
            <h3>Description</h3>
            <textarea
              value={newTask.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className="edit-textarea-mod"
              placeholder="Enter task description..."
              rows={5}
            />
          </section>
          {group !== 0 && (
            <div className="form-group responsible-section">
              <label>Responsible Users:</label>
              <div className="responsible-selector">
                <select
                  value={selectedResponsible}
                  onChange={(e) => setSelectedResponsible(e.target.value)}
                  className="edit-select"
                  disabled={availableResponsible.length === 0}
                >
                  <option value="">Select responsible user</option>
                  {availableResponsible.map((member) => (
                    <option key={member.member_id} value={member.member_id}>
                      {member.name ||
                        member.user_name ||
                        `User ${member.member_id}`}
                    </option>
                  ))}
                </select>
                <button
                  className="add-responsible-btn"
                  onClick={handleAddResponsible}
                  disabled={!selectedResponsible}
                >
                  <Plus size={16} />
                </button>
              </div>
              {newTask.responsible_users.length > 0 && (
                <div className="responsible-users-list">
                  {newTask.responsible_users.map((user) => (
                    <div key={user.member_id} className="responsible-user">
                      <span>
                        <User size={14} />{" "}
                        {user.name ||
                          user.user_name ||
                          `User ${user.member_id}`}
                      </span>
                      <button
                        className="remove-responsible-btn"
                        onClick={() => handleRemoveResponsible(user.member_id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {parentTaskId === 0 && (
            <>
              <div className="section-divider"></div>
              <section className="subtasks">
                <div className="subtasks-header">
                  <h3>Subtasks</h3>
                  <button
                    className="action-btn add-subtask-btn"
                    onClick={() => setShowSubtaskModal(true)}
                  >
                    <Plus size={16} /> Add Subtask
                  </button>
                </div>

                {newTask.subtasks.length > 0 ? (
                  <div className="subtasks-list">
                    {newTask.subtasks.map((subtask, index) => (
                      <div key={index} className="subtask-item">
                        <div className="subtask-info">
                          <span className="subtask-name">
                            {subtask.task_name}
                          </span>
                          <span className="subtask-priority">
                            {priorities.find(
                              (p) => p.id === subtask.priority_id
                            )?.priority_name || "No priority"}
                          </span>
                          <span className="subtask-status">
                            {statuses.find((s) => s.id === subtask.status_id)
                              ?.status || "No status"}
                          </span>
                        </div>
                        <button
                          className="remove-subtask-btn"
                          onClick={() => handleRemoveSubtask(index)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-subtasks">No subtasks added yet</p>
                )}
              </section>
            </>
          )}
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            <button className="action-btn close-edit-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="action-btn save-btn"
              onClick={handleSave}
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

CreateTaskModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onTaskCreate: PropTypes.func.isRequired,
  parentTaskId: PropTypes.number,
  hidden: PropTypes.bool,
  group: PropTypes.bool,
};

export default CreateTaskModal;
