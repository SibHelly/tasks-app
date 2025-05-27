import React from "react";
import { useState, useEffect } from "react";
import api from "../api/api";
import "./Home.css";
import { Plus, Info } from "lucide-react";
import TaskList from "../components/Lists/TaskList";
import TaskModal from "../components/Modals/TaskModal";
import SubtaskModal from "../components/Modals/SubtaskModal";
import CreateTaskModal from "../components/Modals/CreateTaskModal";
import CreateSubtaskModal from "../components/Modals/CreateSubtaskModal";
import CategoryModal from "../components/Modals/CategoryModal";
import CreateCategoryModal from "../components/Modals/CreateCategoryModal";
import CategoryList from "../components/Lists/CategoryList";
import GroupList from "../components/Lists/GroupList";
import GroupModal from "../components/Modals/GroupModal";
import CreateGroupModal from "../components/Modals/CreateGroupModal";
import HelpModal from "../components/Modals/HelpModal";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

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

  // Groups related state
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [addGroup, setAddGroup] = useState(false);

  // Categories related state
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [addCategory, setAddCategory] = useState(false);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/tasks/most-priority");
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

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/group");
        setGroups(response.data.groups || []);
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

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/category");
        setCategories(response.data);
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

  useEffect(() => {
    if (localStorage.getItem("update") === "yes") {
      setUpdateFlag("yes");
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchGroups();
    fetchCategories();
  }, [updateFlag]);

  useEffect(() => {
    const handleAddSubtaskEvent = (event) => {
      const { taskId } = event.detail;

      setAddSubtask(true);
      setAddSubtaskFromDD(true);
      setParentTaskId(taskId);
      setSelectedTaskId(null);
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

  const handleSubtaskCreated = async (subtaskData) => {
    setAddSubtask(false);
    setParentTaskId(null);
    await fetchTasks();
  };

  const handleSubtaskCreatedFromDD = async (subtaskData) => {
    setAddSubtask(false);
    setAddSubtaskFromDD(false);
    setSelectedTaskId(null);
    setParentTaskId(null);
    await fetchTasks();
  };

  const handleCloseCreateSubtask = () => {
    setAddSubtask(false);
    setSelectedTaskId(parentTaskId);
  };

  const handleCloseCreateSubtaskFromDropDown = () => {
    setAddSubtask(false);
    setAddSubtaskFromDD(false);
    setSelectedTaskId(null);
    setParentTaskId(null);
  };

  const handleTaskUpdate = async () => {
    await fetchTasks();
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId);
  };

  const handleCloseGroupModal = () => {
    setSelectedGroupId(null);
  };

  const handleGroupUpdate = async () => {
    await fetchGroups();
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const handleCloseCategoryModal = () => {
    setSelectedCategoryId(null);
  };

  const handleCategoryUpdate = async () => {
    await fetchCategories();
  };

  const helpItems = [
    {
      title: "Task Management",
      content:
        "This section displays your recent tasks. You can: \n- View task details by clicking on it \n- Create new tasks using the 'Create task' button \n- Add subtasks through the task context menu \n- Assign responsible members for group tasks \n- Create discussions and leave comments on group tasks",
    },
    {
      title: "Categories",
      content:
        "This section allows you to: \n- Create categories to organize tasks \n- View existing categories \n- Manage categories (edit, delete) \n- Filter tasks by categories",
    },
    {
      title: "Groups",
      content:
        "Groups enable collaboration by: \n- Creating project-based task groups \n- Managing group members \n- Tracking group progress \n- Centralizing group communications",
    },
    // {
    //   title: "Quick Actions",
    //   content:
    //     "Use keyboard shortcuts for faster access: \n- Ctrl+T: New task \n- Ctrl+G: New group \n- Ctrl+C: New category \n- Ctrl+S: Save current task",
    // },
  ];

  return (
    <>
      <div className="tasks-container">
        <div className="header-container">
          <h1 className="header">Welcome to Task Manager</h1>
          <button className="help-btn" onClick={() => setShowHelp(true)}>
            <Info size={20} />
          </button>
        </div>

        <div className="header-list">
          <h3>Recent tasks</h3>
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
          onTaskUpdate={handleTaskUpdate}
        />

        <div className="header-list">
          <h3>Categories</h3>
          <button
            className="action-btn add-subtask-btn"
            onClick={() => setAddCategory(true)}
          >
            <Plus size={16} />
            Create Category
          </button>
        </div>
        <CategoryList
          categories={categories}
          isLoading={isLoading}
          error={error}
          onCategorySelect={handleCategorySelect}
          onCategoryUpdate={handleCategoryUpdate}
          displayLimit={3}
        />

        <div className="header-list">
          <h3>Groups</h3>
          <button
            className="action-btn add-subtask-btn"
            onClick={() => setAddGroup(true)}
          >
            <Plus size={16} />
            Create Group
          </button>
        </div>
        <GroupList
          groups={groups}
          isLoading={isLoading}
          error={error}
          onGroupSelect={handleGroupSelect}
          onGroupUpdate={handleGroupUpdate}
          displayLimit={3}
        />

        {/* Task Modals */}
        {selectedTaskId && !selectedSubtaskId && (
          <TaskModal
            taskId={selectedTaskId}
            onClose={handleCloseTaskModal}
            onEdit={handleEditSubtask}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        {selectedTaskId &&
          selectedSubtaskId &&
          parentTaskId === selectedTaskId && (
            <TaskModal
              taskId={selectedTaskId}
              onClose={handleCloseTaskModal}
              onEdit={handleEditSubtask}
              onTaskUpdate={handleTaskUpdate}
              hidden={true}
            />
          )}

        {selectedSubtaskId && (
          <SubtaskModal
            taskId={selectedSubtaskId}
            onClose={handleCloseSubtaskModal}
            onEdit={handleEditTask}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

        {addTask && (
          <CreateTaskModal
            onClose={() => {
              setAddTask(false);
            }}
            onTaskCreate={() => {
              setAddTask(false);
            }}
            onTaskUpdate={handleTaskUpdate}
          />
        )}

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

        {/* Category Modals */}
        {selectedCategoryId && (
          <CategoryModal
            categoryId={selectedCategoryId}
            onClose={handleCloseCategoryModal}
            onCategoryUpdate={handleCategoryUpdate}
          />
        )}

        {addCategory && (
          <CreateCategoryModal
            onClose={() => {
              setAddCategory(false);
            }}
            onCategoryCreate={() => {
              setAddCategory(false);
            }}
            onCategoryUpdate={handleCategoryUpdate}
          />
        )}

        {/* Group Modals */}
        {selectedGroupId && (
          <GroupModal
            groupId={selectedGroupId}
            onClose={handleCloseGroupModal}
            onGroupUpdate={handleGroupUpdate}
          />
        )}

        {addGroup && (
          <CreateGroupModal
            onClose={() => {
              setAddGroup(false);
            }}
            onGroupCreate={() => {
              setAddGroup(false);
            }}
            onGroupUpdate={handleGroupUpdate}
          />
        )}

        {/* Help Modal */}
        {showHelp && (
          <HelpModal items={helpItems} onClose={() => setShowHelp(false)} />
        )}
      </div>
    </>
  );
}
