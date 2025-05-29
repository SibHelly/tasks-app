/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Calendar, X, ChevronDown } from "lucide-react";
import api from "../../api/api";
import "./TaskFilter.css";

export default function TaskFilter({
  tasks = [],
  onFilterChange,
  onClose,
  flag = false,
}) {
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load filters from localStorage or use defaults
  const loadFiltersFromStorage = () => {
    try {
      const savedFilters = localStorage.getItem("taskFilters");
      if (savedFilters) {
        return JSON.parse(savedFilters);
      }
    } catch (error) {
      console.error("Error loading filters from storage:", error);
    }

    // Default values if localStorage is empty or has error
    return {
      selectedCategories: [],
      selectedGroups: [],
      selectedPriorities: [],
      showOnlyPersonal: false,
      showOnlyTimeless: false,
      dateRange: { start: "", end: "" },
      selectedParentTaskId: null,
    };
  };

  const initialFilters = loadFiltersFromStorage();

  const [selectedCategories, setSelectedCategories] = useState(
    initialFilters.selectedCategories
  );
  const [selectedGroups, setSelectedGroups] = useState(
    initialFilters.selectedGroups
  );
  const [selectedPriorities, setSelectedPriorities] = useState(
    initialFilters.selectedPriorities
  );
  const [showOnlyPersonal, setShowOnlyPersonal] = useState(
    initialFilters.showOnlyPersonal
  );
  const [showOnlyTimeless, setShowOnlyTimeless] = useState(
    initialFilters.showOnlyTimeless
  );
  const [dateRange, setDateRange] = useState(initialFilters.dateRange);
  const [selectedParentTask, setSelectedParentTask] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchGroups();
    fetchPriorities();
  }, []);

  // Set parent task from saved ID once tasks are loaded
  useEffect(() => {
    if (initialFilters.selectedParentTaskId && tasks.length > 0) {
      const savedTask = tasks.find(
        (task) => task.task_id === initialFilters.selectedParentTaskId
      );
      if (savedTask) {
        setSelectedParentTask(savedTask);
      }
    }
  }, [tasks]);

  useEffect(() => {
    applyFilters();

    // Save current filters to localStorage
    const filtersToSave = {
      selectedCategories,
      selectedGroups,
      selectedPriorities,
      showOnlyPersonal,
      showOnlyTimeless,
      dateRange,
      selectedParentTaskId: selectedParentTask
        ? selectedParentTask.task_id
        : null,
    };

    localStorage.setItem("taskFilters", JSON.stringify(filtersToSave));
  }, [
    selectedCategories,
    selectedGroups,
    selectedPriorities,
    showOnlyPersonal,
    showOnlyTimeless,
    dateRange,
    selectedParentTask,
  ]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/category");
      setCategories(response.data);
    } catch (err) {
      setError("Failed to load categories");
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/group");
      setGroups(response.data.groups || []);
    } catch (err) {
      setError("Failed to load groups");
      console.error("Error fetching groups:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriorities = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/priority");
      setPriorities(response.data);
    } catch (err) {
      setError("Failed to load priorities");
      console.error("Error fetching priorities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredTasks = [...tasks];

    // Filter by parent task
    if (selectedParentTask) {
      filteredTasks = filteredTasks.filter(
        (task) => task.parent_task_id === selectedParentTask.task_id
      );
      onFilterChange(filteredTasks);
      return;
    }

    // Filter by personal tasks
    if (showOnlyPersonal) {
      filteredTasks = filteredTasks.filter((task) => task.group_id === 0);
    }

    // Filter by timeless tasks
    if (showOnlyTimeless) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.start_time === "0001-01-01T00:00:00Z" &&
          task.end_time === "0001-01-01T00:00:00Z"
      );
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedCategories.includes(task.category_id)
      );
    }

    // Filter by groups
    if (selectedGroups.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedGroups.includes(task.group_id)
      );
    }

    // Filter by priorities
    if (selectedPriorities.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedPriorities.includes(task.priority_id)
      );
    }

    if (dateRange.start || dateRange.end) {
      filteredTasks = filteredTasks.filter((task) => {
        // Skip timeless tasks if we're filtering by date
        if (
          task.start_time === "0001-01-01T00:00:00Z" ||
          task.end_time === "0001-01-01T00:00:00Z"
        ) {
          return false;
        }

        const taskStartDate = new Date(task.start_time);
        const taskEndDate = new Date(task.end_time);
        const filterStartDate = dateRange.start
          ? new Date(dateRange.start)
          : null;
        const filterEndDate = dateRange.end ? new Date(dateRange.end) : null;

        // Case 1: Only start date is specified
        if (filterStartDate && !filterEndDate) {
          return taskEndDate >= filterStartDate;
        }

        // Case 2: Only end date is specified
        if (!filterStartDate && filterEndDate) {
          return taskEndDate <= filterEndDate;
        }

        // Case 3: Both dates are specified
        if (filterStartDate && filterEndDate) {
          return (
            (taskStartDate >= filterStartDate &&
              taskStartDate <= filterEndDate) ||
            (taskEndDate >= filterStartDate && taskEndDate <= filterEndDate) ||
            (taskStartDate <= filterStartDate && taskEndDate >= filterEndDate)
          );
        }

        return true;
      });
    }

    onFilterChange(filteredTasks);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handlePriorityChange = (priorityId) => {
    setSelectedPriorities((prev) =>
      prev.includes(priorityId)
        ? prev.filter((id) => id !== priorityId)
        : [...prev, priorityId]
    );
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedGroups([]);
    setSelectedPriorities([]);
    setShowOnlyPersonal(false);
    setShowOnlyTimeless(false);
    setDateRange({ start: "", end: "" });
    setSelectedParentTask(null);

    // Clear localStorage
    localStorage.removeItem("taskFilters");
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest(".modal-filter-dropdown-container")) {
        setShowCategoryDropdown(false);
        setShowGroupDropdown(false);
        setShowPriorityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const parentTasks = tasks.filter((task) => task.parent_task_id === 0);

  // Get selected items labels for display
  const getSelectedCategoryNames = () => {
    if (selectedCategories.length === 0) return "Select categories";
    if (selectedCategories.length === 1) {
      const category = categories.find((c) => c.id === selectedCategories[0]);
      return category ? category.category_name : "1 selected";
    }
    return `${selectedCategories.length} selected`;
  };

  const getSelectedGroupNames = () => {
    if (selectedGroups.length === 0) return "Select groups";
    if (selectedGroups.length === 1) {
      const group = groups.find((g) => g.id === selectedGroups[0]);
      return group ? group.group_name : "1 selected";
    }
    return `${selectedGroups.length} selected`;
  };

  const getSelectedPriorityNames = () => {
    if (selectedPriorities.length === 0) return "Select priorities";
    if (selectedPriorities.length === 1) {
      const priority = priorities.find((p) => p.id === selectedPriorities[0]);
      return priority ? priority.priority_name : "1 selected";
    }
    return `${selectedPriorities.length} selected`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-filter-container">
        <div className="modal-filter-header">
          <h2>Filter Tasks</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-filter-section modal-filter-row">
          <div className="modal-filter-column">
            <label className="modal-filter-checkbox-label">
              <input
                type="checkbox"
                checked={showOnlyPersonal}
                onChange={(e) => setShowOnlyPersonal(e.target.checked)}
                className="modal-filter-checkbox"
              />
              <span className="checkmark"></span>
              <span>Show only personal tasks</span>
            </label>
          </div>
          <div className="modal-filter-column">
            <label className="modal-filter-checkbox-label">
              <input
                type="checkbox"
                checked={showOnlyTimeless}
                onChange={(e) => setShowOnlyTimeless(e.target.checked)}
                className="modal-filter-checkbox"
              />
              <span className="checkmark"></span>
              <span>Show ONLY tasks without dates</span>
            </label>
          </div>
        </div>

        <div className="modal-filter-divider"></div>

        {flag === false && (
          <div className="modal-filter-section">
            <h3 className="modal-filter-section-title">Parent Task</h3>
            <div className="modal-filter-select-wrapper">
              <select
                value={selectedParentTask ? selectedParentTask.task_id : ""}
                onChange={(e) => {
                  const taskId = parseInt(e.target.value);
                  if (taskId) {
                    const task = parentTasks.find((t) => t.task_id === taskId);
                    setSelectedParentTask(task);
                  } else {
                    setSelectedParentTask(null);
                  }
                }}
                className="modal-filter-select"
              >
                <option value="">Select parent task</option>
                {parentTasks.map((task) => (
                  <option key={task.task_id} value={task.task_id}>
                    {task.task_name}
                  </option>
                ))}
              </select>
              <div className="modal-filter-select-icon">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        )}

        <div className="modal-filter-divider"></div>

        <div className="modal-filter-section modal-filter-row">
          <div className="modal-filter-column">
            <h3 className="modal-filter-section-title">Category</h3>
            <div className="modal-filter-dropdown-container">
              <button
                className="modal-filter-dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowGroupDropdown(false);
                  setShowPriorityDropdown(false);
                }}
              >
                {getSelectedCategoryNames()}
                <ChevronDown size={14} />
              </button>
              {showCategoryDropdown && (
                <div
                  className="modal-filter-dropdown-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <label
                        key={category.id}
                        className="modal-filter-checkbox-label"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(
                            category.category_id
                          )}
                          onChange={() =>
                            handleCategoryChange(category.category_id)
                          }
                          className="modal-filter-checkbox"
                        />
                        <span className="checkmark"></span>
                        <span>{category.category_name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="modal-filter-empty">
                      No categories available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="modal-filter-column">
            <h3 className="modal-filter-section-title">Priority</h3>
            <div className="modal-filter-dropdown-container">
              <button
                className="modal-filter-dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPriorityDropdown(!showPriorityDropdown);
                  setShowCategoryDropdown(false);
                  setShowGroupDropdown(false);
                }}
              >
                {getSelectedPriorityNames()}
                <ChevronDown size={14} />
              </button>
              {showPriorityDropdown && (
                <div
                  className="modal-filter-dropdown-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {priorities.length > 0 ? (
                    priorities.map((priority) => (
                      <div
                        key={priority.id}
                        className="modal-filter-priority-item"
                      >
                        <div
                          className="modal-filter-priority-color"
                          style={{ backgroundColor: priority.color }}
                        ></div>
                        <label className="modal-filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedPriorities.includes(
                              priority.priority_id
                            )}
                            onChange={(e) => {
                              e.stopPropagation();
                              handlePriorityChange(priority.priority_id);
                            }}
                            className="modal-filter-checkbox"
                          />
                          <span className="checkmark"></span>
                          <span>{priority.priority_name}</span>
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="modal-filter-empty">
                      No priorities available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-filter-column">
            <h3 className="modal-filter-section-title">Group</h3>
            <div className="modal-filter-dropdown-container">
              <button
                className="modal-filter-dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGroupDropdown(!showGroupDropdown);
                  setShowCategoryDropdown(false);
                  setShowPriorityDropdown(false);
                }}
              >
                {getSelectedGroupNames()}
                <ChevronDown size={14} />
              </button>
              {showGroupDropdown && (
                <div
                  className="modal-filter-dropdown-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <label
                        key={group.id}
                        className="modal-filter-checkbox-label"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.group_id)}
                          onChange={() => handleGroupChange(group.group_id)}
                          className="modal-filter-checkbox"
                        />
                        <span className="checkmark"></span>
                        <span>{group.group_name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="modal-filter-empty">
                      No groups available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-filter-divider"></div>

        <div className="modal-filter-section modal-filter-row">
          <div className="modal-filter-column">
            <h3 className="modal-filter-section-title">Date Range</h3>
            <div className="modal-filter-date-range">
              <div className="modal-filter-date-field">
                <label>Start:</label>
                <div className="modal-filter-date-input-wrapper">
                  <Calendar size={16} className="modal-filter-date-icon" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      handleDateRangeChange("start", e.target.value)
                    }
                    className="modal-filter-date-input"
                  />
                </div>
              </div>
              <div className="modal-filter-date-field">
                <label>End:</label>
                <div className="modal-filter-date-input-wrapper">
                  <Calendar size={16} className="modal-filter-date-icon" />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      handleDateRangeChange("end", e.target.value)
                    }
                    className="modal-filter-date-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-filter-actions">
          <button
            onClick={clearFilters}
            className="modal-filter-button modal-filter-reset"
          >
            Reset
          </button>
          <button
            onClick={() => {
              applyFilters();
              onClose();
            }}
            className="modal-filter-button modal-filter-apply"
          >
            Apply Filters
          </button>
        </div>

        {isLoading && <div className="modal-filter-loading">Loading...</div>}

        {error && <div className="modal-filter-error">{error}</div>}
      </div>
    </div>
  );
}
