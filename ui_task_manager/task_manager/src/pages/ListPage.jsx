import React from "react";
import { useState, useEffect } from "react";
import api from "../api/api";
import "./Home.css";
import { Filter, Plus } from "lucide-react";
import TaskList from "../components/Lists/TaskList";
import TaskModal from "../components/Modals/TaskModal";
import SubtaskModal from "../components/Modals/SubtaskModal";
import CreateTaskModal from "../components/Modals/CreateTaskModal";
import CreateSubtaskModal from "../components/Modals/CreateSubtaskModal";
import TaskFilter from "../components/Dop/TaskFilter";

export default function ListPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  // Новая переменная для сохранения примененного фильтра
  // eslint-disable-next-line no-unused-vars
  const [activeFilterCriteria, setActiveFilterCriteria] = useState(null);

  // State for handling modal display
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [updateFlag, setUpdateFlag] = useState(
    localStorage.getItem("update") || null
  );
  const [addTask, setAddTask] = useState(false);
  const [addSubtask, setAddSubtask] = useState(false);
  const [addSubtaskFromDD, setAddSubtaskFromDD] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [lastAppliedFilter, setLastAppliedFilter] = useState(null);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/tasks");
        const allTasks = response.data.tasks;
        setTasks(allTasks);

        // Применяем тот же фильтр к обновленным задачам, если он существует
        if (activeFilterCriteria) {
          applyFilterCriteria(allTasks, activeFilterCriteria);
        } else {
          setFilteredTasks(allTasks);
        }

        // Clear the update flag after fetching
        if (localStorage.getItem("update") === "yes") {
          localStorage.removeItem("update");
          setUpdateFlag(null);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Новая функция для применения критериев фильтра
  const applyFilterCriteria = (tasksToFilter, criteria) => {
    let filtered = [...tasksToFilter];

    // Применяем те же критерии фильтрации, как в TaskFilter.jsx
    // Фильтр по родительской задаче
    if (criteria.selectedParentTask) {
      filtered = filtered.filter(
        (task) => task.parent_task_id === criteria.selectedParentTask.task_id
      );
    }

    // Фильтр по личным задачам
    if (criteria.showOnlyPersonal) {
      filtered = filtered.filter((task) => task.group_id === 0);
    }

    // Фильтр по задачам без дат
    if (criteria.showOnlyTimeless) {
      filtered = filtered.filter(
        (task) =>
          task.start_time === "0001-01-01T00:00:00Z" &&
          task.end_time === "0001-01-01T00:00:00Z"
      );
    }

    // Фильтр по категориям
    if (criteria.selectedCategories.length > 0) {
      filtered = filtered.filter((task) =>
        criteria.selectedCategories.includes(task.category_id)
      );
    }

    // Фильтр по группам
    if (criteria.selectedGroups.length > 0) {
      filtered = filtered.filter((task) =>
        criteria.selectedGroups.includes(task.group_id)
      );
    }

    // Фильтр по приоритетам
    if (criteria.selectedPriorities.length > 0) {
      filtered = filtered.filter((task) =>
        criteria.selectedPriorities.includes(task.priority_id)
      );
    }

    // Фильтр по диапазону дат
    if (criteria.dateRange.start && criteria.dateRange.end) {
      const startDate = new Date(criteria.dateRange.start);
      const endDate = new Date(criteria.dateRange.end);

      filtered = filtered.filter((task) => {
        if (
          task.start_time !== "0001-01-01T00:00:00Z" &&
          task.end_time !== "0001-01-01T00:00:00Z"
        ) {
          const taskStartDate = new Date(task.start_time);
          const taskEndDate = new Date(task.end_time);

          return (
            (taskStartDate >= startDate && taskStartDate <= endDate) ||
            (taskEndDate >= startDate && taskEndDate <= endDate) ||
            (taskStartDate <= startDate && taskEndDate >= endDate)
          );
        }
        return true;
      });
    }

    setFilteredTasks(filtered);
  };

  // Watch for changes to the update flag
  useEffect(() => {
    if (localStorage.getItem("update") === "yes") {
      setUpdateFlag("yes");
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFlag]);

  useEffect(() => {
    const handleAddSubtaskEvent = (event) => {
      const { taskId } = event.detail;

      setAddSubtask(true);
      setAddSubtaskFromDD(true);
      setParentTaskId(taskId);
      setSelectedTaskId(null); // Ensure task modal is closed
    };

    document.addEventListener("addSubtask", handleAddSubtaskEvent);

    return () => {
      document.removeEventListener("addSubtask", handleAddSubtaskEvent);
    };
  }, []);

  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseTaskModal = () => {
    setSelectedTaskId(null);
  };

  const handleCloseSubtaskModal = () => {
    setSelectedSubtaskId(null);
  };

  const handleEditTask = (taskId) => {
    console.log("Edit task:", taskId);
  };

  const handleEditSubtask = (subtaskId, parentId, isCreateSubtask) => {
    if (isCreateSubtask) {
      setAddSubtask(true);
      setParentTaskId(subtaskId);
      setSelectedTaskId(null);
    } else {
      setSelectedSubtaskId(subtaskId);
      setParentTaskId(parentId);
    }
  };

  // Handle successful subtask creation
  const handleSubtaskCreated = async (subtaskData) => {
    setAddSubtask(false); // Close the subtask creation modal
    setParentTaskId(null); // Clear the parent task ID reference
    await fetchTasks(); // Refresh the task list
  };

  const handleSubtaskCreatedFromDD = async (subtaskData) => {
    setAddSubtask(false); // Close the subtask creation modal
    setAddSubtaskFromDD(false);
    setSelectedTaskId(null);
    setParentTaskId(null);
    await fetchTasks(); // Refresh the task list
  };

  // Handle closing the subtask creation modal
  const handleCloseCreateSubtask = () => {
    setAddSubtask(false); // Close the subtask creation modal
    setSelectedTaskId(parentTaskId); // Reopen the parent task modal
  };

  const handleCloseCreateSubtaskFromDropDown = () => {
    setAddSubtask(false); // Close the subtask creation modal
    setAddSubtaskFromDD(false);
    setSelectedTaskId(null);
    setParentTaskId(null);
  };

  // Handler for task updates (create, delete, update)
  const handleTaskUpdate = async () => {
    await fetchTasks();
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <div className="tasks-container">
        <h1 className="header">Your task list</h1>

        <div className="header-list">
          <h3>Tasks</h3>
          <div className="btns">
            <button
              className="action-btn filter-btn"
              onClick={() => setShowFilterModal(true)}
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              className="action-btn add-subtask-btn"
              onClick={() => setAddTask(true)}
            >
              <Plus size={16} />
              Create task
            </button>
          </div>
        </div>

        <TaskList
          tasks={filteredTasks}
          isLoading={isLoading}
          error={error}
          onTaskSelect={handleTaskSelect}
          onTaskUpdate={handleTaskUpdate} // Pass the task update handler to TaskList
        />

        {/* Render TaskModal when a main task is selected */}
        {selectedTaskId && !selectedSubtaskId && (
          <TaskModal
            taskId={selectedTaskId}
            onClose={handleCloseTaskModal}
            onEdit={handleEditSubtask}
            onTaskUpdate={handleTaskUpdate} // Pass the consistent task update handler
          />
        )}

        {/* Keep TaskModal in DOM but hide it when subtask modal is open */}
        {selectedTaskId &&
          selectedSubtaskId &&
          parentTaskId === selectedTaskId && (
            <TaskModal
              taskId={selectedTaskId}
              onClose={handleCloseTaskModal}
              onEdit={handleEditSubtask}
              onTaskUpdate={handleTaskUpdate} // Pass the consistent task update handler
              hidden={true}
            />
          )}

        {/* Render SubtaskModal when a subtask is selected */}
        {selectedSubtaskId && (
          <SubtaskModal
            taskId={selectedSubtaskId}
            onClose={handleCloseSubtaskModal}
            onEdit={handleEditTask}
            onTaskUpdate={handleTaskUpdate} // Pass the consistent task update handler
          />
        )}

        {/* Render CreateTaskModal when adding a new task */}
        {addTask && (
          <CreateTaskModal
            onClose={() => {
              setAddTask(false);
            }}
            onTaskCreate={() => {
              setAddTask(false);
            }}
            onTaskUpdate={handleTaskUpdate} // Pass the consistent task update handler
          />
        )}

        {/* Render CreateSubtaskModal when adding a new subtask */}
        {addSubtask && !addSubtaskFromDD && (
          <CreateSubtaskModal
            parentTaskId={parentTaskId}
            onClose={handleCloseCreateSubtask}
            onSubtaskCreate={handleSubtaskCreated}
          />
        )}
        {addSubtask && addSubtaskFromDD && (
          <CreateSubtaskModal
            parentTaskId={parentTaskId}
            onClose={handleCloseCreateSubtaskFromDropDown}
            onSubtaskCreate={handleSubtaskCreatedFromDD}
          />
        )}

        {/* Render TaskFilter modal */}
        {showFilterModal && (
          <TaskFilter
            tasks={tasks}
            onFilterChange={(filtered) => {
              setFilteredTasks(filtered);
              // Сохраняем последнюю функцию фильтрации
              setLastAppliedFilter(() => (tasks) => {
                // Воссоздаем условия фильтрации
                // Это будет функция, которая фильтрует задачи так же, как последний примененный фильтр
                return tasks.filter((task) => {
                  return filtered.some(
                    (filteredTask) => filteredTask.task_id === task.task_id
                  );
                });
              });
            }}
            onClose={() => setShowFilterModal(false)}
            flag={true}
          />
        )}
      </div>
    </>
  );
}
