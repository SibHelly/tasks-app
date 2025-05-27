import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { Info, MoreVertical } from "lucide-react";
import DropdownMenu from "../Dropdown";
import "./SubtaskList.css";

const SubtaskList = ({
  tasks,
  isLoading = false,
  error = null,
  onTaskSelect,
  onTaskUpdate,
  groupId = 0,
}) => {
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const moreButtonsRef = useRef({});

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

  useEffect(() => {
    if (groupId !== 0) {
      fetchCurrentUserRole();
    }
    fetchPriority();
    fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!dateString) return "";
    if (dateString === "0001-01-01T00:00:00Z") return "";
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
    // Call the parent's onTaskSelect function with the taskId
    if (onTaskSelect) {
      onTaskSelect(taskId, "subtask");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      // Send request to delete the task
      await api.delete(`/tasks/delete/${taskId}`);

      localStorage.setItem("update", "yes");

      // Call the task update function from props
      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (err) {
      console.error("Error deleting subtask:", err);
      alert("Ошибка при удалении подзадачи");
    }
  };

  const handleFinishTask = async (taskId) => {
    try {
      // Find the "Completed" status or similar
      const completedStatus = statuses.find(
        (s) =>
          s.status.toLowerCase().includes("complete") ||
          s.status.toLowerCase().includes("done")
      );

      if (!completedStatus) {
        throw new Error("Completed status not found");
      }

      await api.patch(`/tasks/update/${taskId}`, {
        status_id: completedStatus.status_id,
      });

      localStorage.setItem("update", "yes");

      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (err) {
      console.error("Error finishing subtask:", err);
      alert("Ошибка при завершении подзадачи");
    }
  };

  const toggleDropdown = (taskId) => {
    setActiveDropdown(activeDropdown === taskId ? null : taskId);
  };

  const getTaskActions = (task) => {
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
      return baseActions;
    }
  };

  if (isLoading) return <div className="loading">Loading subtasks...</div>;
  if (error)
    return (
      <div className="error">
        Error: {error.message || "Failed to load subtasks"}
      </div>
    );
  if (tasks.length === 0) return <div className="empty">No subtasks found</div>;

  return (
    <div className="subtask-list">
      {tasks.map((task) => (
        <React.Fragment key={task.task_id}>
          <div
            className={`task-item subtask ${getPriorityClass(
              task.priority_id
            )}`}
          >
            <div className="subtask-content">
              <div className="subtask-name">
                <div className="expand-placeholder"></div>
                <span>{task.task_name}</span>
              </div>
              <div className="subtask-status">
                {getStatusText(task.status_id)}
              </div>
              <div
                className={`task-priority ${getPriorityClass(
                  task.priority_id
                )}`}
              >
                {getPriorityText(task.priority_id)}
              </div>
              <div className="subtask-deadline">
                {formatDate(task.end_time)}
              </div>
              <div className="subtask-actions">
                <button
                  className="info-button"
                  onClick={() => handleTaskInfo(task.task_id)}
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

          {activeDropdown === task.task_id && (
            <DropdownMenu
              items={getTaskActions(task)}
              onClose={() => setActiveDropdown(null)}
              triggerRef={{ current: moreButtonsRef.current[task.task_id] }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

SubtaskList.propTypes = {
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

export default SubtaskList;
