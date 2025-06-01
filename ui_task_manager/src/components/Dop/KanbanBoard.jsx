/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { MoreVertical, Info, User, Users, Calendar, Flag } from "lucide-react";
import TaskModal from "../Modals/TaskModal";
import SubtaskModal from "../Modals/SubtaskModal";
import CreateSubtaskModal from "../Modals/CreateSubtaskModal";
import DropdownMenu from "../Dropdown";
import "./KanbanBoard.css";

const KanbanBoard = ({
  tasks,
  onTaskUpdate,
  onTaskStatusChange,
  groupId = 0,
}) => {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("member");
  const [dragItem, setDragItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [parentTasks, setParentTasks] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [previousModal, setPreviousModal] = useState(null);
  const [showSubtaskCreationModal, setShowSubtaskCreationModal] =
    useState(false);
  const [selectedParentTaskId, setSelectedParentTaskId] = useState(null);
  const moreButtonsRef = useRef({});

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

  const fetchCurrentUserRole = async () => {
    try {
      const response = await api.get(`/group/${groupId}/role`);
      setCurrentUserRole(response.data.role);
    } catch (err) {
      console.error("Error fetching current user role:", err);
      setCurrentUserRole("member");
    }
  };

  const fetchParentTask = async (parentTaskId) => {
    if (!parentTaskId || parentTasks[parentTaskId]) return;
    try {
      const response = await api.get(`/tasks/get/${parentTaskId}`);
      // Correctly handle the API response format for parent tasks
      if (response.data && response.data.tasks) {
        setParentTasks((prev) => ({
          ...prev,
          [parentTaskId]: response.data.tasks,
        }));
      }
    } catch (err) {
      console.error("Error fetching parent task:", err);
    }
  };

  useEffect(() => {
    fetchStatuses();
    if (groupId !== 0) {
      fetchCurrentUserRole();
    }

    // Pre-fetch parent tasks for all subtasks
    tasks.forEach((task) => {
      if (task.parent_task_id) {
        fetchParentTask(task.parent_task_id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, tasks]);

  const handleDragStart = (e, task) => {
    setDragItem(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.task_id);
  };

  const handleDragOver = (e, statusId) => {
    e.preventDefault();
    setDragOverColumn(statusId);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setDragOverColumn(null);
  };

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    if (!dragItem) return;

    const newStatusId = statusId === "no-status" ? 0 : statusId;

    try {
      // Сначала сохраняем предыдущее состояние задачи (для отката в случае ошибки)
      const previousStatus = dragItem.status_id;

      // Локальное обновление интерфейса перед API-запросом для более отзывчивого интерфейса
      if (onTaskStatusChange) {
        onTaskStatusChange(dragItem.task_id, newStatusId);
      }

      // После этого выполняем API-запрос
      await api.put(`/tasks/update/status/${dragItem.task_id}`, {
        status_id: newStatusId,
      });

      // Если не передан обработчик onTaskStatusChange, то используем стандартное обновление
      if (!onTaskStatusChange && onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (err) {
      console.error("Error updating task status:", err);
      alert("Error updating task status");

      // В случае ошибки откатываем изменения в интерфейсе
      if (onTaskStatusChange) {
        onTaskStatusChange(dragItem.task_id, dragItem.status_id);
      }
    } finally {
      setDragItem(null);
      setDragOverColumn(null);
    }
  };

  const groupTasksByStatus = (tasks) => {
    const grouped = {};
    statuses.forEach((status) => {
      grouped[status.status_id] = tasks.filter(
        (task) => task.status_id === status.status_id
      );
    });
    grouped["no-status"] = tasks.filter(
      (task) => !statuses.some((status) => status.status_id === task.status_id)
    );
    return grouped;
  };

  const tasksByStatus = groupTasksByStatus(tasks);

  if (isLoading) return <div className="loading">Loading board...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="kanban-board">
      <div className="columns-wrapper">
        {statuses.map((status) => (
          <div
            key={status.status_id}
            className={`column ${
              dragOverColumn === status.status_id ? "drag-over" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, status.status_id)}
            onDrop={(e) => handleDrop(e, status.status_id)}
          >
            <div className="column-header">
              <h3>{status.status}</h3>
              <span className="task-count">
                {tasksByStatus[status.status_id]?.length || 0}
              </span>
            </div>
            <div className="tasks-container">
              {tasksByStatus[status.status_id]?.map((task) => (
                <TaskCard
                  key={task.task_id}
                  task={task}
                  parentTask={parentTasks[task.parent_task_id]}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onTaskUpdate={onTaskUpdate}
                  currentUserRole={currentUserRole}
                  groupId={groupId}
                  setActiveModal={setActiveModal}
                  setPreviousModal={setPreviousModal}
                  setShowSubtaskCreationModal={setShowSubtaskCreationModal}
                  setSelectedParentTaskId={setSelectedParentTaskId}
                  activeModal={activeModal}
                  moreButtonsRef={moreButtonsRef}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-columns-wrapper">
        <div
          className={`column ${
            dragOverColumn === "no-status" ? "drag-over" : ""
          }`}
          onDragOver={(e) => handleDragOver(e, "no-status")}
          onDrop={(e) => handleDrop(e, "no-status")}
        >
          <div className="column-header">
            <h3>No Status</h3>
            <span className="task-count">
              {tasksByStatus["no-status"]?.length || 0}
            </span>
          </div>
          <div className="tasks-container">
            {tasksByStatus["no-status"]?.map((task) => (
              <TaskCard
                key={task.task_id}
                task={task}
                parentTask={parentTasks[task.parent_task_id]}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTaskUpdate={onTaskUpdate}
                currentUserRole={currentUserRole}
                groupId={groupId}
                setActiveModal={setActiveModal}
                setPreviousModal={setPreviousModal}
                setShowSubtaskCreationModal={setShowSubtaskCreationModal}
                setSelectedParentTaskId={setSelectedParentTaskId}
                activeModal={activeModal}
                moreButtonsRef={moreButtonsRef}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
              />
            ))}
          </div>
        </div>
      </div>

      {activeModal &&
        (activeModal.isSubtask ? (
          <SubtaskModal
            taskId={activeModal.taskId}
            parentTask={activeModal.parentTask}
            onClose={() => {
              if (previousModal) {
                setActiveModal(previousModal);
                setPreviousModal(null);
              } else {
                setActiveModal(null);
              }
            }}
            onUpdate={onTaskUpdate}
          />
        ) : (
          <TaskModal
            taskId={activeModal.taskId}
            onClose={() => setActiveModal(null)}
            onUpdate={onTaskUpdate}
            onEdit={(taskId, parentTaskId, isSubtask) => {
              if (isSubtask) {
                setPreviousModal(activeModal);
                setSelectedParentTaskId(taskId);
                setShowSubtaskCreationModal(true);
                setActiveModal(null);
              } else {
                setPreviousModal(activeModal);
                setActiveModal({
                  taskId,
                  isSubtask: true,
                  parentTask: parentTasks[parentTaskId],
                });
              }
            }}
            onCreateSubtask={(parentTaskId) => {
              setPreviousModal(activeModal);
              setSelectedParentTaskId(parentTaskId);
              setShowSubtaskCreationModal(true);
              setActiveModal(null);
            }}
            hidden={showSubtaskCreationModal}
          />
        ))}

      {showSubtaskCreationModal && selectedParentTaskId && (
        <CreateSubtaskModal
          parentTaskId={selectedParentTaskId}
          onClose={() => {
            setShowSubtaskCreationModal(false);
            if (previousModal) {
              setActiveModal(previousModal);
              setPreviousModal(null);
            }
          }}
          onSubtaskCreate={async () => {
            await onTaskUpdate();
          }}
        />
      )}
    </div>
  );
};

const TaskCard = ({
  task,
  parentTask,
  onDragStart,
  onDragEnd,
  onTaskUpdate,
  currentUserRole,
  groupId,
  setActiveModal,
  setPreviousModal,
  setShowSubtaskCreationModal,
  setSelectedParentTaskId,
  activeModal,
  moreButtonsRef,
  activeDropdown,
  setActiveDropdown,
}) => {
  const [priorities, setPriorities] = useState([]);
  const isSubtask = !!task.parent_task_id;
  const isGroupTask = task.group_id > 0;

  const fetchPriority = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const response = await api.get("/priority");
      setPriorities(response.data);
    }
  };

  useEffect(() => {
    fetchPriority();
  }, []);

  const getPriorityClass = (priorityId) => {
    const priority = priorities.find((p) => p.priority_id === priorityId);
    if (!priority) return "";

    return `priority-${priority.priority_id}`;
  };

  const getPriorityStyle = (priorityId) => {
    const priority = priorities.find((p) => p.priority_id === priorityId);
    if (!priority || !priority.color) return {};

    return { borderLeft: `3px solid ${priority.color}` };
  };

  const getPriorityText = (priorityId) => {
    const priority = priorities.find((p) => p.priority_id === priorityId);
    return priority ? priority.priority_name : "Not priority";
  };

  const formatDate = (dateString) => {
    if (dateString === "0001-01-01T00:00:00Z") return "";
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/delete/${taskId}`);
      localStorage.setItem("update", "yes");
      if (onTaskUpdate) {
        await onTaskUpdate();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Error deleting task");
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
      alert("Error finishing task");
    }
  };

  const handleAddSubtask = (taskId) => {
    setActiveModal({
      taskId,
      isSubtask: false,
    });
    setActiveDropdown(null);
  };

  const handleInfoClick = () => {
    setActiveModal({
      taskId: task.task_id,
      isSubtask,
      parentTask,
    });
  };

  const getTaskActions = () => {
    const isSubtask = !!task.parent_task_id;
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
        onClick: () => {
          setActiveDropdown(null);
          // Сохраняем текущий контекст для возврата
          if (activeModal) {
            // Если уже есть активное модальное окно, сохраняем его для возврата
            setPreviousModal(activeModal);
            setActiveModal(null);
          }
          // Открываем модальное окно создания подзадачи
          setSelectedParentTaskId(task.task_id);
          setShowSubtaskCreationModal(true);
        },
      });
    }

    if (groupId !== 0 && currentUserRole === "member") {
      return baseActions.filter((action) => action.label !== "Delete");
    }

    return baseActions;
  };

  const toggleDropdown = (e, taskId) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === taskId ? null : taskId);
  };

  // Get parent task name from the parentTask object with correct structure
  const getParentTaskName = () => {
    if (!parentTask) return "Loading...";
    return parentTask.task_name || "Unknown";
  };

  return (
    <div
      className={`task-card ${getPriorityClass(task.priority_id)} ${
        isSubtask ? "subtask-card" : ""
      }`}
      style={getPriorityStyle(task.priority_id)}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      {isSubtask && (
        <div className="parent-task-info">
          Parent task: {getParentTaskName()}
        </div>
      )}

      <div className="task-header">
        <div className="task-name">
          {task.task_name}{" "}
          <button
            className="menu-button"
            onClick={(e) => toggleDropdown(e, task.task_id)}
            ref={(el) => (moreButtonsRef.current[task.task_id] = el)}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <div className="task-details">
        <div className="task-priority">
          <Flag size={16} />
          <span>{getPriorityText(task.priority_id)}</span>
        </div>
        {task.end_time && task.end_time !== "0001-01-01T00:00:00Z" && (
          <div className="task-deadline">
            <Calendar size={14} />
            <span>{formatDate(task.end_time)}</span>
          </div>
        )}
        <div className="task-type">
          {isGroupTask ? <Users size={18} /> : <User size={18} />}
        </div>
      </div>

      <button className="task-info-button" onClick={handleInfoClick}>
        <Info size={14} />
        <span>INFO</span>
      </button>

      {activeDropdown === task.task_id && (
        <DropdownMenu
          items={getTaskActions()}
          onClose={() => setActiveDropdown(null)}
          triggerRef={{ current: moreButtonsRef.current[task.task_id] }}
        />
      )}
    </div>
  );
};

KanbanBoard.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      task_id: PropTypes.number.isRequired,
      task_name: PropTypes.string.isRequired,
      priority_id: PropTypes.number.isRequired,
      status_id: PropTypes.string,
      end_time: PropTypes.string,
      parent_task_id: PropTypes.number,
      group_id: PropTypes.number,
    })
  ).isRequired,
  onTaskUpdate: PropTypes.func,
  onTaskStatusChange: PropTypes.func, // Новый пропс
  groupId: PropTypes.number,
};

TaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  parentTask: PropTypes.object,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onTaskUpdate: PropTypes.func,
  currentUserRole: PropTypes.string,
  groupId: PropTypes.number,
  setActiveModal: PropTypes.func.isRequired,
  setPreviousModal: PropTypes.func.isRequired,
  setShowSubtaskCreationModal: PropTypes.func.isRequired,
  setSelectedParentTaskId: PropTypes.func.isRequired,
  activeModal: PropTypes.object,
  moreButtonsRef: PropTypes.object.isRequired,
  activeDropdown: PropTypes.number,
  setActiveDropdown: PropTypes.func.isRequired,
};

export default KanbanBoard;
