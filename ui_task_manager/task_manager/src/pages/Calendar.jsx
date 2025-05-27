import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, MoreVertical, X } from "lucide-react";
import api from "../api/api";
import TaskModal from "../components/Modals/TaskModal";
import CreateTaskModal from "../components/Modals/CreateTaskModal";
import CreateSubtaskModal from "../components/Modals/CreateSubtaskModal";
import SubtaskModal from "../components/Modals/SubtaskModal";
import DropdownMenu from "../components/Dropdown";
import "./CalendarPage.css";

const CalendarPage = () => {
  // State for calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCell, setExpandedCell] = useState(null);

  // Ref for calendar grid to measure dimensions
  const calendarGridRef = useRef(null);
  const calendarCellsRef = useRef({});

  // State for modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateSubtaskModal, setShowCreateSubtaskModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);

  // State for selected items
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedParentTaskId, setSelectedParentTaskId] = useState(0);

  // State to track previous modal for proper return navigation
  const [previousModalState, setPreviousModalState] = useState(null);

  // State for dropdown menu
  const [activeDropdown, setActiveDropdown] = useState(null);
  const moreButtonsRef = useRef({});

  // State for expanded cell position
  const [expandedCellStyle, setExpandedCellStyle] = useState({});

  // Ref for task containers to calculate heights
  const taskContainersRef = useRef({});

  // Fetch tasks and priorities
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/tasks");

      if (response.data && response.data.tasks) {
        // Filter out subtasks (parent_task_id !== 0)
        const mainTasks = response.data.tasks.filter(
          (task) => task.parent_task_id === 0
        );
        setTasks(mainTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriorities = async () => {
    try {
      const response = await api.get("/priority");
      setPriorities(response.data);
    } catch (error) {
      console.error("Error fetching priorities:", error);
    }
  };

  // Initialize calendar data
  useEffect(() => {
    fetchTasks();
    fetchPriorities();
  }, []);

  // Update calendar when month changes
  useEffect(() => {
    generateCalendarDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, tasks]);

  // Generate days for the current month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate days from previous month to display
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Create array of days
    const days = [];

    // Add days from previous month
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (
      let i = prevMonthLastDate - daysFromPrevMonth + 1;
      i <= prevMonthLastDate;
      i++
    ) {
      days.push({
        date: new Date(year, month - 1, i),
        isCurrentMonth: false,
        tasks: getTasksForDate(new Date(year, month - 1, i)),
      });
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        tasks: getTasksForDate(new Date(year, month, i)),
      });
    }

    // Add days from next month to complete the grid (always 6 rows of 7 days = 42 cells)
    const totalDaysNeeded = 42;
    const remainingDays = totalDaysNeeded - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        tasks: getTasksForDate(new Date(year, month + 1, i)),
      });
    }

    setCalendarDays(days);
  };

  // Get tasks that fall on a specific date
  const getTasksForDate = (date) => {
    if (!tasks || tasks.length === 0) return [];

    return tasks.filter((task) => {
      // Skip tasks without valid end dates
      if (!task.end_time || task.end_time === "0001-01-01T00:00:00Z") {
        return false;
      }

      const taskEndDate = new Date(task.end_time);

      // Check if the task's end date matches the calendar cell date
      return (
        taskEndDate.getFullYear() === date.getFullYear() &&
        taskEndDate.getMonth() === date.getMonth() &&
        taskEndDate.getDate() === date.getDate()
      );
    });
  };

  // Navigation functions
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setExpandedCell(null);
    setExpandedCellStyle({});
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setExpandedCell(null);
    setExpandedCellStyle({});
  };

  // Task modal functions
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setShowTaskModal(true);
    setActiveDropdown(null);
    // No previous modal to return to
    setPreviousModalState(null);
  };

  const handleAddTask = (date) => {
    const dateWithDefaultTime = new Date(date);
    dateWithDefaultTime.setHours(12, 0, 0, 0);
    setSelectedDate(dateWithDefaultTime);
    setShowCreateTaskModal(true);
    setActiveDropdown(null);
  };

  const handleAddSubtask = (parentId) => {
    // Save current state to return to after closing the subtask modal
    if (showTaskModal) {
      setPreviousModalState({
        type: "taskModal",
        taskId: selectedTaskId,
      });
    }

    setSelectedParentTaskId(parentId);
    setShowCreateSubtaskModal(true);
    setActiveDropdown(null);
  };

  const handleFinishTask = async (taskId) => {
    try {
      await api.put(`/tasks/finish/${taskId}`);
      await fetchTasks();
    } catch (error) {
      console.error("Error finishing task:", error);
    } finally {
      setActiveDropdown(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/delete/${taskId}`);
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setActiveDropdown(null);
    }
  };

  // Function to handle modal closing with proper return navigation
  const handleModalClose = (currentModalType) => {
    // Close current modal
    switch (currentModalType) {
      case "taskModal":
        setShowTaskModal(false);
        break;
      case "createTaskModal":
        setShowCreateTaskModal(false);
        break;
      case "createSubtaskModal":
        setShowCreateSubtaskModal(false);
        break;
      case "subtaskModal":
        setShowSubtaskModal(false);
        break;
      default:
        break;
    }

    // Return to previous modal if there was one
    if (previousModalState) {
      switch (previousModalState.type) {
        case "taskModal":
          setSelectedTaskId(previousModalState.taskId);
          setShowTaskModal(true);
          break;
        case "subtaskModal":
          setSelectedTaskId(previousModalState.taskId);
          setShowSubtaskModal(true);
          break;
        default:
          break;
      }
      // Clear previous modal state
      setPreviousModalState(null);
    }
  };

  const calculateExpandedCellPosition = (index) => {
    if (!calendarGridRef.current || !calendarCellsRef.current[index]) return {};

    const cellRect = calendarCellsRef.current[index].getBoundingClientRect();
    // const gridRect = calendarGridRef.current.getBoundingClientRect();

    let popupWidth = Math.max(320, Math.min(400, cellRect.width * 1.5));
    let popupHeight = Math.min(450, Math.max(300, cellRect.height * 3));

    let left = cellRect.left;
    let top = cellRect.top;
    let transformOrigin = "top left";

    const spaceRight = window.innerWidth - cellRect.right;
    if (spaceRight < popupWidth) {
      left = Math.max(10, cellRect.right - popupWidth);
      transformOrigin = "top right";
    }

    const spaceBottom = window.innerHeight - cellRect.bottom;
    if (spaceBottom < popupHeight) {
      top = cellRect.top - popupHeight + cellRect.height;
      transformOrigin = "bottom left";

      if (top < 10) {
        popupHeight = Math.min(cellRect.bottom - 10, popupHeight);
        top = cellRect.bottom - popupHeight;
        transformOrigin = "top left";
      }
    }

    left = Math.max(10, Math.min(left, window.innerWidth - popupWidth - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - popupHeight - 10));

    return {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      width: `${popupWidth}px`,
      height: `${popupHeight}px`,
      zIndex: 100,
      transformOrigin,
      backgroundColor: "#ffffff",
      boxShadow: "0 0 15px rgba(0,0,0,0.2)",
      borderRadius: "8px",
      border: "1px solid #e0e0e0",
      overflow: "hidden",
    };
  };

  const toggleCellExpansion = (index) => {
    if (expandedCell === index) {
      setExpandedCell(null);
      setExpandedCellStyle({});
      setActiveDropdown(null);
    } else {
      setExpandedCell(index);
      setTimeout(() => {
        setExpandedCellStyle(calculateExpandedCellPosition(index));
      }, 0);
      setActiveDropdown(null);
    }
  };

  const toggleDropdown = (taskId, isExpanded, e) => {
    e.stopPropagation();
    // Use a composite key that includes both task ID and view type
    const dropdownKey = isExpanded ? `expanded_${taskId}` : `normal_${taskId}`;
    setActiveDropdown(activeDropdown === dropdownKey ? null : dropdownKey);
  };

  const getDropdownItems = (taskId) => {
    return [
      {
        label: "Info",
        onClick: () => {
          handleTaskClick(taskId);
        },
      },
      {
        label: "Add Subtask",
        onClick: () => {
          handleAddSubtask(taskId);
        },
      },
      {
        label: "Finish",
        onClick: () => {
          handleFinishTask(taskId);
        },
      },
      {
        label: "Delete",
        onClick: () => {
          handleDeleteTask(taskId);
        },
      },
    ];
  };

  const getTaskColor = (priorityId) => {
    if (priorities && priorities.length > 0) {
      const priority = priorities.find((p) => p.priority_id === priorityId);
      if (priority && priority.color) {
        return `task-color-custom-${priorityId}`;
      }
    }

    switch (priorityId) {
      case 1:
        return "task-color-high";
      case 2:
        return "task-color-medium";
      case 3:
        return "task-color-normal";
      case 4:
        return "task-color-low";
      default:
        return "task-color-default";
    }
  };

  const formatMonthYear = () => {
    const options = { month: "long", year: "numeric" };
    return currentDate.toLocaleDateString("en-US", options);
  };

  const getVisibleTasksCount = (cellIndex) => {
    const TASK_ITEM_HEIGHT = 32;
    const HEADER_HEIGHT = 30;
    const PADDING = 16;
    const MORE_INDICATOR_HEIGHT = 22;

    if (!calendarCellsRef.current[cellIndex]) {
      return 3;
    }

    const cellRect =
      calendarCellsRef.current[cellIndex].getBoundingClientRect();
    const cellHeight = cellRect.height;

    const availableHeight =
      cellHeight - HEADER_HEIGHT - PADDING - MORE_INDICATOR_HEIGHT;

    return Math.max(1, Math.floor(availableHeight / TASK_ITEM_HEIGHT));
  };

  const handleMoreClick = (index, e) => {
    e.stopPropagation();
    toggleCellExpansion(index);
  };

  // Handle edit from TaskModal
  const handleTaskEdit = (taskId, parentTaskId, isSubtask) => {
    // Save the current state to return to
    setPreviousModalState({
      type: "taskModal",
      taskId: selectedTaskId,
    });

    setShowTaskModal(false);

    if (isSubtask) {
      setSelectedParentTaskId(parentTaskId || 0);
      setSelectedTaskId(taskId);
      setShowSubtaskModal(true);
    } else {
      setSelectedTaskId(taskId);
      setShowCreateTaskModal(true);
    }
  };

  // Handle edit from SubtaskModal
  const handleSubtaskEdit = (taskId) => {
    // Save the current modal to return to
    setPreviousModalState({
      type: "subtaskModal",
      taskId: selectedTaskId,
    });

    setShowSubtaskModal(false);
    setSelectedTaskId(taskId);
    setShowTaskModal(true);
  };

  return (
    <div className="calendar-page">
      <h1>Your tasks on calendar</h1>

      <div className="calendar-header">
        <button className="nav-button" onClick={handlePrevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h2>{formatMonthYear()}</h2>
        <button className="nav-button" onClick={handleNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-grid" ref={calendarGridRef}>
        <div className="calendar-weekdays">
          <div className="weekday">Mon</div>
          <div className="weekday">Tue</div>
          <div className="weekday">Wed</div>
          <div className="weekday">Thu</div>
          <div className="weekday">Fri</div>
          <div className="weekday">Sat</div>
          <div className="weekday">Sun</div>
        </div>

        <div className="calendar-days">
          {isLoading ? (
            <div className="loading">Loading calendar...</div>
          ) : (
            calendarDays.map((dayInfo, index) => {
              const isExpanded = expandedCell === index;
              const visibleTasksCount = getVisibleTasksCount(index);
              const hiddenTasksCount = Math.max(
                0,
                dayInfo.tasks.length - visibleTasksCount
              );

              return (
                <div
                  key={index}
                  className={`calendar-cell ${
                    dayInfo.isCurrentMonth ? "current-month" : "other-month"
                  }`}
                  ref={(el) => (calendarCellsRef.current[index] = el)}
                  onClick={() => toggleCellExpansion(index)}
                >
                  <div className="cell-header">
                    <span className="day-number">{dayInfo.date.getDate()}</span>
                    <button
                      className="add-task-button-cal"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTask(dayInfo.date);
                      }}
                      data-tooltip="Open full information about task"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div
                    className="tasks-container-cal"
                    ref={(el) => (taskContainersRef.current[index] = el)}
                  >
                    {dayInfo.tasks.slice(0, visibleTasksCount).map((task) => (
                      <div
                        key={task.task_id}
                        className={`task-item-cal ${getTaskColor(
                          task.priority_id
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task.task_id);
                        }}
                      >
                        <span className="task-name-cal">{task.task_name}</span>
                        <button
                          className="task-menu-button-cal"
                          ref={(el) => {
                            // Make sure we're updating the ref for this task
                            moreButtonsRef.current[`task_${task.task_id}`] = el;
                          }}
                          onClick={(e) =>
                            toggleDropdown(task.task_id, false, e)
                          }
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeDropdown === `normal_${task.task_id}` && (
                          <DropdownMenu
                            items={getDropdownItems(task.task_id)}
                            onClose={() => setActiveDropdown(null)}
                            triggerRef={{
                              current:
                                moreButtonsRef.current[`task_${task.task_id}`],
                            }}
                          />
                        )}
                      </div>
                    ))}
                    {!isExpanded && hiddenTasksCount > 0 && (
                      <span
                        className="more-tasks-indicator"
                        onClick={(e) => handleMoreClick(index, e)}
                      >
                        +{hiddenTasksCount} more
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div
                      className="expanded-cell-popup"
                      style={expandedCellStyle}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="expanded-cell-header">
                        <span className="expanded-day-number">
                          {dayInfo.date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="act">
                          <button
                            className="add-task-button-cal"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTask(dayInfo.date);
                            }}
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            className="close-expanded-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCell(null);
                              setExpandedCellStyle({});
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div
                        className="expanded-tasks-scroll-container"
                        style={{
                          maxHeight: "calc(100% - 40px)",
                          overflowY: "auto",
                        }}
                      >
                        <div className="expanded-tasks-container">
                          {dayInfo.tasks.map((task) => (
                            <div
                              key={task.task_id}
                              className={`task-item-cal ${getTaskColor(
                                task.priority_id
                              )}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task.task_id);
                              }}
                            >
                              <span className="task-name-cal">
                                {task.task_name}
                              </span>
                              <button
                                className="task-menu-button-cal"
                                onClick={(e) =>
                                  toggleDropdown(task.task_id, true, e)
                                }
                                ref={(el) => {
                                  // We need a unique identifier for expanded view
                                  moreButtonsRef.current[
                                    `expanded_task_${task.task_id}`
                                  ] = el;
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {activeDropdown ===
                                `expanded_${task.task_id}` && (
                                <DropdownMenu
                                  items={getDropdownItems(task.task_id)}
                                  onClose={() => setActiveDropdown(null)}
                                  triggerRef={{
                                    current:
                                      moreButtonsRef.current[
                                        `expanded_task_${task.task_id}`
                                      ],
                                  }}
                                />
                              )}
                            </div>
                          ))}
                          {dayInfo.tasks.length === 0 && (
                            <div className="no-tasks-message">
                              No tasks for this day
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Task modals */}
      {showTaskModal && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => handleModalClose("taskModal")}
          onEdit={handleTaskEdit}
          onTaskUpdate={fetchTasks}
          onCreateSubtask={(parentId) => {
            // Save current modal state
            setPreviousModalState({
              type: "taskModal",
              taskId: selectedTaskId,
            });
            setShowTaskModal(false);
            setSelectedParentTaskId(parentId);
            setShowCreateSubtaskModal(true);
          }}
        />
      )}

      {showCreateTaskModal && (
        <CreateTaskModal
          onClose={() => handleModalClose("createTaskModal")}
          onTaskCreate={fetchTasks}
          onTaskUpdate={fetchTasks}
          parentTaskId={0}
          hidden={!showCreateTaskModal}
          end_time={selectedDate}
        />
      )}

      {showCreateSubtaskModal && (
        <CreateSubtaskModal
          parentTaskId={selectedParentTaskId}
          onClose={() => handleModalClose("createSubtaskModal")}
          onSubtaskCreate={fetchTasks}
        />
      )}

      {showSubtaskModal && (
        <SubtaskModal
          taskId={selectedTaskId}
          onClose={() => handleModalClose("subtaskModal")}
          onEdit={handleSubtaskEdit}
          onTaskUpdate={fetchTasks}
        />
      )}
    </div>
  );
};

export default CalendarPage;
