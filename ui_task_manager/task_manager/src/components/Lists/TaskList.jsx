import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { Info, MoreVertical, ChevronDown, ChevronRight } from "lucide-react";
import DropdownMenu from "../Dropdown";
import "./TaskList.css";

const TaskList = ({
  tasks,
  isLoading = false,
  error = null,
  onTaskSelect,
  onTaskUpdate,
  groupId = 0,
}) => {
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const moreButtonsRef = useRef({});

  const fetchPriority = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const response = await api.get("/priority");
      setPriorities(response.data);
    }
  };

  const fetchStatuses = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const response = await api.get("/statuses");
      setStatuses(response.data);
    }
  };
  const [currentUserRole, setCurrentUserRole] = useState("member");

  const fetchCurrentUserRole = async () => {
    try {
      const response = await api.get(`/group/${groupId}/role`);
      setCurrentUserRole(response.data.role);
    } catch (err) {
      console.error("Error fetching current user role:", err);
      setCurrentUserRole("member");
    }
  };

  useEffect(() => {
    if (groupId !== 0) {
      fetchCurrentUserRole();
    }
    fetchPriority();
    fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group tasks with subtasks
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!task.parent_task_id) {
      acc[task.task_id] = {
        ...task,
        subtasks: tasks.filter((t) => t.parent_task_id === task.task_id),
      };
    }
    return acc;
  }, {});

  // Standalone tasks
  const standaloneTasks = tasks.filter(
    (task) => !task.parent_task_id && !groupedTasks[task.task_id]
  );

  const allTasks = [...Object.values(groupedTasks), ...standaloneTasks];

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getPriorityClass = (priorityId) => {
    const priority = priorities.find((p) => p.priority_id === priorityId);
    return priority ? `priority-${priority.priority_name}` : "";
  };

  const getPriorityText = (priorityId) => {
    const priority = priorities.find((p) => p.priority_id === priorityId);
    return priority ? `${priority.priority_name} priority` : "";
  };

  const getStatusText = (statusId) => {
    const status = statuses.find((s) => s.status_id === statusId);
    return status ? status.status : "";
  };

  const formatDate = (dateString) => {
    if (dateString === "0001-01-01T00:00:00Z") return "";
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      "until " +
      date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(",", "")
    );
  };

  const handleTaskInfo = (taskId) => {
    if (onTaskSelect) {
      onTaskSelect(taskId);
    }
  };

  const handleSubtaskInfo = (taskId) => {
    if (onTaskSelect) {
      onTaskSelect(taskId);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Send request to delete task
      await api.delete(`/tasks/delete/${taskId}`);

      // Set flag in localStorage
      localStorage.setItem("update", "yes");

      // Call the parent component's update function if provided
      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Ошибка при удалении задачи");
    } finally {
      // Close dropdown after action
      setActiveDropdown(null);
    }
  };

  const handleFinishTask = async (taskId) => {
    try {
      await api.put(`/tasks/finish/${taskId}`);

      localStorage.setItem("update", "yes");

      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (err) {
      console.error("Error finishing task:", err);
      alert("Ошибка при завершении задачи");
    } finally {
      // Close dropdown after action
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (taskId) => {
    setActiveDropdown(activeDropdown === taskId ? null : taskId);
  };

  const handleAddSubtask = (taskId) => {
    // We need to signal to the parent component to open the CreateSubtaskModal
    // First close the dropdown
    setActiveDropdown(null);

    // Then inform the parent component we want to create a subtask for this task
    if (onTaskSelect) {
      onTaskSelect(taskId);
      const customEvent = new CustomEvent("addSubtask", { detail: { taskId } });
      document.dispatchEvent(customEvent);
    }
  };

  const getTaskActions = (task) => {
    const isSubtask = !!task.parent_task_id;
    if (groupId !== 0 && currentUserRole === "member") {
      const baseActions = [
        {
          label: "Finish",
          onClick: () => handleFinishTask(task.task_id),
        },
      ];
      return baseActions;
    } else {
      const baseActions = [
        {
          label: "Finish",
          onClick: () => handleFinishTask(task.task_id),
        },
        {
          label: "Delete",
          onClick: () => handleDeleteTask(task.task_id),
        },
      ];
      if (!isSubtask) {
        baseActions.splice(1, 0, {
          label: "Add Subtask",
          onClick: () => handleAddSubtask(task.task_id),
        });
      }
      return baseActions;
    }
  };

  if (isLoading) return <div className="loading">Loading tasks...</div>;
  if (error)
    return (
      <div className="error">
        Error: {error.message || "Failed to load tasks"}
      </div>
    );
  if (tasks.length === 0) return <div className="empty">No tasks found</div>;

  return (
    <div className="task-list">
      {allTasks.map((task) => (
        <React.Fragment key={task.task_id}>
          <div className={`task-item ${getPriorityClass(task.priority_id)}`}>
            <div className="task-content-1">
              <div className="task-name-1">
                {task.subtasks.length > 0 && (
                  <button
                    className="expand-button"
                    onClick={() => toggleTaskExpansion(task.task_id)}
                    data-tooltip="Open full information about task"
                  >
                    {expandedTasks.includes(task.task_id) ? (
                      <ChevronDown className="expand-icon" />
                    ) : (
                      <ChevronRight className="expand-icon" />
                    )}
                  </button>
                )}
                {task.subtasks.length === 0 && (
                  <div className="expand-placeholder"></div>
                )}
                <span>{task.task_name}</span>
              </div>
              <div className="info">
                <div className="task-status-1">
                  {getStatusText(task.status_id)}
                </div>
                <div
                  className={`task-priority ${getPriorityClass(
                    task.priority_id
                  )}`}
                >
                  {getPriorityText(task.priority_id)}
                </div>
                <div className="task-deadline">{formatDate(task.end_time)}</div>
                <div className="task-actions"> 
                  <button
                    className="info-button"
                    onClick={() => handleTaskInfo(task.task_id)}
                    title="Open full information about task"
                    data-tooltip="Open full information about task"
                  >
                    <Info size={18} />
                    <span>INFO</span>
                  </button>
                  <button
                    className="more-button"
                    ref={(el) => (moreButtonsRef.current[task.task_id] = el)}
                    onClick={() => toggleDropdown(task.task_id)}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {activeDropdown === task.task_id && (
            <DropdownMenu
              items={getTaskActions(task)}
              onClose={() => setActiveDropdown(null)}
              triggerRef={{ current: moreButtonsRef.current[task.task_id] }}
            />
          )}

          {expandedTasks.includes(task.task_id) &&
            task.subtasks.map((subtask) => (
              <div
                key={subtask.task_id}
                className={`task-item subtask ${getPriorityClass(
                  subtask.priority_id
                )}`}
              >
                <div className="task-content-1">
                  <div className="task-name-1">
                    <div className="expand-placeholder"></div>
                    <span>{subtask.task_name}</span>
                  </div>
                  <div className="info">
                    <div className="task-status">
                      {getStatusText(subtask.status_id)}
                    </div>
                    <div
                      className={`task-priority ${getPriorityClass(
                        subtask.priority_id
                      )}`}
                    >
                      {getPriorityText(subtask.priority_id)}
                    </div>
                    <div className="task-deadline">
                      {formatDate(subtask.end_time)}
                    </div>
                    <div className="task-actions">
                      <button
                        className="info-button"
                        onClick={() => handleSubtaskInfo(subtask.task_id)}
                      >
                        <Info size={18} />
                        <span>INFO</span>
                      </button>
                      <button
                        className="more-button"
                        ref={(el) =>
                          (moreButtonsRef.current[subtask.task_id] = el)
                        }
                        onClick={() => toggleDropdown(subtask.task_id)}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {activeDropdown === subtask.task_id && (
                  <DropdownMenu
                    items={getTaskActions(subtask)}
                    onClose={() => setActiveDropdown(null)}
                    triggerRef={{
                      current: moreButtonsRef.current[subtask.task_id],
                    }}
                  />
                )}
              </div>
            ))}
        </React.Fragment>
      ))}
    </div>
  );
};

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      task_id: PropTypes.number.isRequired,
      task_name: PropTypes.string.isRequired,
      priority_id: PropTypes.number.isRequired,
      status_id: PropTypes.string.isRequired,
      end_time: PropTypes.string,
      parent_task_id: PropTypes.number,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onTaskSelect: PropTypes.func,
  onTaskUpdate: PropTypes.func,
};

export default TaskList;
