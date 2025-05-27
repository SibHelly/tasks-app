import React from "react";
import { useState, useEffect } from "react";
import api from "../api/api";
import "./Home.css";
import { Plus } from "lucide-react";
import TaskList from "../components/Lists/TaskList";
import TaskModal from "../components/Modals/TaskModal";
import SubtaskModal from "../components/Modals/SubtaskModal";
import CreateTaskModal from "../components/Modals/CreateTaskModal";
import CreateSubtaskModal from "../components/Modals/CreateSubtaskModal";

export default function ListPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/tasks");
        setTasks(response.data.tasks);
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

  // Watch for changes to the update flag
  useEffect(() => {
    if (localStorage.getItem("update") === "yes") {
      setUpdateFlag("yes");
    }
  }, []);

  useEffect(() => {
    fetchTasks();
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

  return (
    <>
      <div className="tasks-container">
        <h1 className="header">Your task list</h1>

        <div className="header-list">
          <h3>Tasks</h3>
          <button
            className="action-btn add-subtask-btn"
            onClick={() => setAddTask(true)}
          >
            <Plus size={16} />
            Create task
          </button>
        </div>
        <TaskList
          tasks={tasks}
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
      </div>
    </>
  );
}
