import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import {
  X,
  Users,
  List,
  Tag,
  MessageSquare,
  Trash2,
  Info,
  Plus,
  Edit,
  Save,
} from "lucide-react";
import TaskList from "../Lists/TaskList";
import CategoryList from "../Lists/CategoryList";
import CreateCategoryModal from "../Modals/CreateCategoryModal";
import "./GroupModal.css";
import CreateTaskModal from "./CreateTaskModal";
import TaskModal from "./TaskModal";
import CreateSubtaskModal from "./CreateSubtaskModal";
import ChatList from "../Lists/ChatList";
import CategoryModal from "./CategoryModal";

const AddMemberModal = ({
  groupId,
  onClose,
  onMemberAdded,
  currentUserRole,
}) => {
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userCheckError, setUserCheckError] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const checkUserExists = async (username) => {
    try {
      setIsCheckingUser(true);
      setUserCheckError(null);

      const response = await api.post("/check/user", {
        user_name: username,
      });

      return response.data.user;
    } catch (err) {
      console.error("Error checking user:", err);
      setUserCheckError("User not found");
      return false;
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setUserCheckError("Please enter a username");
      return;
    }

    const userExists = await checkUserExists(newMemberName);
    if (!userExists) {
      setUserCheckError("User not found");
      return;
    }

    try {
      setIsAddingMember(true);
      await api.put(`/group/${groupId}/user`, {
        member_id: userExists,
        role: newMemberRole,
      });

      setNewMemberName("");
      setNewMemberRole("member");
      setUserCheckError(null);
      onMemberAdded();
      onClose();
    } catch (err) {
      console.error("Error adding member:", err);
      setUserCheckError(err.response?.data?.message || "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="add-member-modal">
        <div className="modal-header">
          <h3>Add New Member</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            {userCheckError && (
              <div className="error-message">{userCheckError}</div>
            )}
            <label>Username</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => {
                setNewMemberName(e.target.value);
                setUserCheckError(null);
              }}
              placeholder="Enter member username"
              className="task-name-input"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="add-member-modal select"
            >
              <option value="member">Member</option>
              {currentUserRole === "owner" && (
                <option value="editor">Editor</option>
              )}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="add-member-button"
            onClick={handleAddMember}
            disabled={isAddingMember || isCheckingUser}
          >
            {isAddingMember ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
};

AddMemberModal.propTypes = {
  groupId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onMemberAdded: PropTypes.func.isRequired,
  currentUserRole: PropTypes.string.isRequired,
};

const GroupModal = ({ groupId, onClose, onGroupUpdate }) => {
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owner, setOwner] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("member");
  const [currentUserId, setCurrentUserId] = useState(0);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedGroupDescription, setEditedGroupDescription] = useState("");
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberRole, setEditingMemberRole] = useState("");

  // Modal states
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateSubtaskModal, setShowCreateSubtaskModal] = useState(false);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [addSubtaskFromList, setAddSubtaskFromList] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [chats, setChats] = useState([]);

  const modalRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.post("/user", { user_id: userId });
      return response.data.user;
    } catch (err) {
      console.error("Error fetching user details:", err);
      return null;
    }
  };

  const fetchGroupOwner = async (groupId) => {
    try {
      const response = await api.get(`/group/owner/${groupId}`);
      return response.data.owner;
    } catch (err) {
      console.error("Error fetching group owner:", err);
      return null;
    }
  };

  const fetchCurrentUserRole = async () => {
    try {
      const response = await api.get(`/group/${groupId}/role`);
      setCurrentUserRole(response.data.role);
      setCurrentUserId(response.data.user_id);
    } catch (err) {
      console.error("Error fetching current user role:", err);
      setCurrentUserRole("member");
    }
  };

  const fetchGroupData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (token) {
        await fetchCurrentUserRole();

        const groupResponse = await api.get(`/group/${groupId}`);
        setGroup(groupResponse.data.group);
        setEditedGroupName(groupResponse.data.group.group_name);
        setEditedGroupDescription(groupResponse.data.group.description || "");

        const tasksResponse = await api.get(`/tasks/group/${groupId}`);
        setTasks(tasksResponse.data.tasks || []);

        const membersResponse = await api.get(`/group/${groupId}/users`);
        const membersWithDetails = await Promise.all(
          membersResponse.data.users.map(async (member) => {
            const details = await fetchUserDetails(member.member_id);
            return { ...member, ...details };
          })
        );
        setMembers(membersWithDetails);

        const ownerData = await fetchGroupOwner(groupId);
        setOwner(ownerData);

        const categoriesResponse = await api.get(`/category/group/${groupId}`);
        setCategories(categoriesResponse.data);

        const chatsResponse = await api.get(`/chats/group/${groupId}`);
        // Убедимся, что chats всегда массив
        setChats(chatsResponse.data?.Chats || []);
      }
    } catch (err) {
      console.error("Error fetching group data:", err);
      setError({
        message: "Failed to load group data",
        details: err.response?.data?.message || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Handle task selection
  const handleTaskSelect = (taskId, parentId = null) => {
    setSelectedTaskId(taskId);
    setParentTaskId(parentId);
    setShowTaskModal(true);
    setShowCreateSubtaskModal(false);
  };

  // Handle creating subtask from task modal button
  const handleCreateSubtask = (parentId) => {
    // Close the task modal
    setShowTaskModal(false);
    setSelectedTaskId(null);

    // Open the create subtask modal
    setParentTaskId(parentId);
    setShowCreateSubtaskModal(true);
    setAddSubtaskFromList(false);
  };

  // Handle creating subtask from dropdown menu in task list
  const handleCreateSubtaskFromList = (parentId) => {
    setParentTaskId(parentId);
    setShowCreateSubtaskModal(true);
    setAddSubtaskFromList(true);
    setShowTaskModal(false);
    setSelectedTaskId(null);
  };

  const handleChatUpdate = async () => {
    try {
      const chatsResponse = await api.get(`/chats/group/${groupId}`);
      // Убедимся, что chats всегда массив
      setChats(chatsResponse.data?.Chats || []);
    } catch (err) {
      console.error("Error refreshing chats:", err);
    }
  };

  // Set up event listener for the custom "addSubtask" event
  useEffect(() => {
    const handleAddSubtaskEvent = (event) => {
      const { taskId } = event.detail;
      handleCreateSubtaskFromList(taskId);
    };

    document.addEventListener("addSubtask", handleAddSubtaskEvent);

    return () => {
      document.removeEventListener("addSubtask", handleAddSubtaskEvent);
    };
  }, []);

  // Handle task update
  const handleTaskUpdate = async () => {
    try {
      const tasksResponse = await api.get(`/tasks/group/${groupId}`);
      setTasks(tasksResponse.data.tasks || []);

      if (onGroupUpdate) {
        await onGroupUpdate();
      }
    } catch (err) {
      console.error("Error refreshing tasks:", err);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setShowCategoryModal(true);
  };

  // Handle subtask creation completion
  const handleSubtaskCreated = async () => {
    setShowCreateSubtaskModal(false);
    setParentTaskId(null);

    // Only reopen the task modal if we didn't come from the list
    if (!addSubtaskFromList) {
      setShowTaskModal(true);
      setSelectedTaskId(parentTaskId);
    } else {
      setAddSubtaskFromList(false);
    }

    await handleTaskUpdate();
  };

  // Handle closing task modal
  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTaskId(null);
    setParentTaskId(null);
  };

  // Handle closing create subtask modal
  const handleCloseCreateSubtaskModal = () => {
    setShowCreateSubtaskModal(false);

    // Only reopen the task modal if we didn't come from the list
    if (!addSubtaskFromList) {
      setShowTaskModal(true);
      setSelectedTaskId(parentTaskId);
    } else {
      setAddSubtaskFromList(false);
    }
  };

  // Updated member added handler
  const handleMemberAdded = async () => {
    await fetchGroupData();
  };

  // Updated task created handler
  const handleTaskCreated = async () => {
    setShowCreateTaskModal(false);
    await handleTaskUpdate();
  };

  // Updated category created handler
  const handleCategoryCreated = async () => {
    setShowCreateCategoryModal(false);
    await fetchGroupData();
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await api.delete(`/group/${groupId}/delete`, {
          data: { member_id: memberId },
        });
        await fetchGroupData();
      } catch (err) {
        console.error("Error removing member:", err);
        alert("Failed to remove member");
      }
    }
  };

  const handleUpdateMemberRole = async (memberId) => {
    try {
      await api.put(`/group/${groupId}/user`, {
        member_id: memberId,
        role: editingMemberRole,
      });
      setEditingMemberId(null);
      await fetchGroupData();
      if (onGroupUpdate) {
        await onGroupUpdate();
      }
    } catch (err) {
      console.error("Error updating member role:", err);
      alert("Failed to update member role");
    }
  };

  const handleSaveGroupInfo = async () => {
    try {
      await api.put(`/group/${groupId}`, {
        group_name: editedGroupName,
        description: editedGroupDescription,
      });
      setIsEditingGroup(false);
      await fetchGroupData();
      if (onGroupUpdate) {
        await onGroupUpdate();
      }
    } catch (err) {
      console.error("Error updating group info:", err);
      alert("Failed to update group information");
    }
  };

  const handleDisbandGroup = async () => {
    if (window.confirm("Are you sure you want to disband this group?")) {
      try {
        await api.delete(`/group/${groupId}`);
        onClose();
        if (onGroupUpdate) {
          onGroupUpdate();
        }
      } catch (err) {
        console.error("Error disbanding group:", err);
        alert("Failed to disband group");
      }
    }
  };

  const handleCategoryUpdate = async () => {
    await fetchGroupData();
  };

  const handleCategoryDelete = async (categoryId) => {
    try {
      await api.delete(`/category/${categoryId}`);
      await fetchGroupData();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category");
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-loading">Loading group data...</div>
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

  if (!group) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-error">Group not found</div>
      </div>
    );
  }

  const taskCount = tasks.filter((t) => t.parent_task_id === 0).length;
  const completedTasksCount = tasks.filter(
    (t) => t.status_id === 0 && t.parent_task_id === 0
  ).length;
  const completedTasksDisplay =
    taskCount > 0 && completedTasksCount === taskCount
      ? "All"
      : completedTasksCount;

  const canEdit = currentUserRole === "owner" || currentUserRole === "editor";

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="group-modal" ref={modalRef}>
        <div className="modal-sidebar">
          <div className="sidebar-header">
            <h2>{group.group_name}</h2>
          </div>

          <ul className="sidebar-tabs">
            <li
              className={`sidebar-tab ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <Info size={16} />
              <span>Information</span>
            </li>
            <li
              className={`sidebar-tab ${
                activeTab === "members" ? "active" : ""
              }`}
              onClick={() => setActiveTab("members")}
            >
              <Users size={16} />
              <span>Members</span>
            </li>
            <li
              className={`sidebar-tab ${
                activeTab === "categories" ? "active" : ""
              }`}
              onClick={() => setActiveTab("categories")}
            >
              <Tag size={16} />
              <span>Categories</span>
            </li>
            <li
              className={`sidebar-tab ${activeTab === "tasks" ? "active" : ""}`}
              onClick={() => setActiveTab("tasks")}
            >
              <List size={16} />
              <span>Tasks</span>
            </li>
            <li
              className={`sidebar-tab ${
                activeTab === "discussions" ? "active" : ""
              }`}
              onClick={() => setActiveTab("discussions")}
            >
              <MessageSquare size={16} />
              <span>Discussions</span>
            </li>
          </ul>

          {currentUserRole === "owner" && (
            <div className="sidebar-footer">
              <button className="disband-button" onClick={handleDisbandGroup}>
                <Trash2 size={16} />
                <span>Disband Group</span>
              </button>
            </div>
          )}
        </div>

        <div className="modal-content">
          <div className="content-header">
            <h3>
              {activeTab === "info" && "Information"}
              {activeTab === "members" && "Members"}
              {activeTab === "categories" && "Categories"}
              {activeTab === "tasks" && "Tasks"}
              {activeTab === "discussions" && "Discussions"}
            </h3>
            <div className="if-create">
              {activeTab === "categories" && canEdit && (
                <button
                  className="create-category-button"
                  onClick={() => setShowCreateCategoryModal(true)}
                >
                  <Plus size={16} />
                  <span>Create Category</span>
                </button>
              )}
              {activeTab === "members" && canEdit && (
                <button
                  className="add-member-button"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  <Plus size={16} />
                  <span>Add Member</span>
                </button>
              )}
              {canEdit && activeTab === "tasks" && (
                <button
                  className="add-member-button"
                  onClick={() => setShowCreateTaskModal(true)}
                >
                  <Plus size={16} />
                  <span>Create Task</span>
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
          </div>

          {activeTab === "info" && (
            <div className="info-tab">
              <div className="info-section">
                <div className="info-item">
                  <span className="info-label">Group Name:</span>
                  {isEditingGroup ? (
                    <input
                      type="text"
                      value={editedGroupName}
                      onChange={(e) => setEditedGroupName(e.target.value)}
                      className="edit-group-input"
                    />
                  ) : (
                    <span className="info-value">{group.group_name}</span>
                  )}
                </div>
                <div className="info-item">
                  <span className="info-label">Description:</span>
                  {isEditingGroup ? (
                    <textarea
                      value={editedGroupDescription}
                      onChange={(e) =>
                        setEditedGroupDescription(e.target.value)
                      }
                      className="edit-group-textarea"
                    />
                  ) : (
                    <span className="info-value">
                      {group.description || "No description provided"}
                    </span>
                  )}
                </div>
                <div className="info-item">
                  <span className="info-label">Created by:</span>
                  <span className="info-value">{owner}</span>
                </div>
              </div>

              {canEdit && (
                <div className="edit-group-buttons">
                  {isEditingGroup ? (
                    <>
                      <button
                        className="add-member-button"
                        onClick={handleSaveGroupInfo}
                      >
                        <Save size={16} />
                        <span>Save</span>
                      </button>
                      <button
                        className="close-button"
                        onClick={() => setIsEditingGroup(false)}
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="add-member-button"
                      onClick={() => setIsEditingGroup(true)}
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              )}

              <div className="stats-section">
                <div className="stats-grid">
                  <div className="stat-card">
                    <Users size={24} />
                    <div className="stat-content">
                      <div className="stat-number">{members.length}</div>
                      <div className="stat-label">Members</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <List size={24} />
                    <div className="stat-content">
                      <div className="stat-number">{taskCount}</div>
                      <div className="stat-label">Total Tasks</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <List size={24} />
                    <div className="stat-content">
                      <div className="stat-number">{completedTasksDisplay}</div>
                      <div className="stat-label">Completed Tasks</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="members-tab">
              <div className="members-list">
                {members.length > 0 ? (
                  <div className="members-grid">
                    <div className="members-header">
                      <div className="header-item">User</div>
                      <div className="header-item">Phone</div>
                      <div className="header-item">Role</div>
                      <div className="header-item">Actions</div>
                    </div>
                    {members.map((member) => (
                      <div key={member.member_id} className="member-row">
                        <div className="member-cell user-info">
                          <div className="member-avatar">
                            {member.name
                              ? member.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <span className="member-name">
                            {member.name || "Unknown User"}
                          </span>
                        </div>
                        <div className="member-cell">
                          <span className="member-phone">
                            {member.phone || "-"}
                          </span>
                        </div>
                        <div className="member-cell">
                          <span className={`member-role ${member.role}`}>
                            {member.role}
                          </span>
                        </div>
                        <div className="member-cell actions">
                          {currentUserRole === "owner" &&
                            member.role !== "owner" && (
                              <>
                                {editingMemberId === member.member_id ? (
                                  <div className="role-edit-container">
                                    <select
                                      value={editingMemberRole}
                                      onChange={(e) =>
                                        setEditingMemberRole(e.target.value)
                                      }
                                      className="role-select"
                                    >
                                      <option value="member">Member</option>
                                      <option value="editor">Editor</option>
                                    </select>
                                    <button
                                      className="icon-button save"
                                      onClick={() =>
                                        handleUpdateMemberRole(member.member_id)
                                      }
                                      title="Save"
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button
                                      className="icon-button cancel"
                                      onClick={() => setEditingMemberId(null)}
                                      title="Cancel"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="action-buttons">
                                    <button
                                      className="icon-button edit"
                                      onClick={() => {
                                        setEditingMemberId(member.member_id);
                                        setEditingMemberRole(member.role);
                                      }}
                                      title="Edit role"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      className="icon-button remove"
                                      onClick={() =>
                                        handleRemoveMember(member.member_id)
                                      }
                                      title="Remove member"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          {currentUserRole === "editor" &&
                            member.role !== "owner" &&
                            currentUserId !== member.member_id && (
                              <>
                                {editingMemberId === member.member_id ? (
                                  <div className="role-edit-container">
                                    <select
                                      value={editingMemberRole}
                                      onChange={(e) =>
                                        setEditingMemberRole(e.target.value)
                                      }
                                      className="role-select"
                                    >
                                      <option value="member">Member</option>
                                    </select>
                                    <button
                                      className="icon-button save"
                                      onClick={() =>
                                        handleUpdateMemberRole(member.member_id)
                                      }
                                      title="Save"
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button
                                      className="icon-button cancel"
                                      onClick={() => setEditingMemberId(null)}
                                      title="Cancel"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="icon-button edit"
                                    onClick={() => {
                                      setEditingMemberId(member.member_id);
                                      setEditingMemberRole(member.role);
                                    }}
                                    title="Edit role"
                                  >
                                    <Edit size={16} />
                                  </button>
                                )}
                              </>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-list">No members found</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="categories-tab">
              <div className="list-container">
                <CategoryList
                  categories={categories}
                  onCategoryUpdate={handleCategoryUpdate}
                  onCategoryDelete={handleCategoryDelete}
                  onCategorySelect={handleCategorySelect}
                  canEdit={canEdit}
                  groupId={groupId}
                />
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="tasks-tab">
              <div className="list-container">
                <TaskList
                  tasks={tasks}
                  isLoading={false}
                  error={null}
                  onTaskSelect={handleTaskSelect}
                  onTaskUpdate={handleTaskUpdate}
                  canEdit={canEdit}
                  groupId={groupId}
                />
              </div>
            </div>
          )}

          {activeTab === "discussions" && (
            <div className="discussions-tab">
              <div className="list-container-1">
                <ChatList
                  chats={chats}
                  onChatSelect={(chatID) => {
                    // Обработка выбора чата, если нужно
                  }}
                  onChatUpdate={handleChatUpdate}
                  canEdit={canEdit}
                  groupId={groupId}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal components */}
      {showCreateCategoryModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateCategoryModal(false)}
          onCategoryCreate={handleCategoryCreated}
          onCategoryUpdate={handleCategoryUpdate}
          groupID={groupId}
        />
      )}

      {showAddMemberModal && (
        <AddMemberModal
          groupId={groupId}
          onClose={() => setShowAddMemberModal(false)}
          onMemberAdded={handleMemberAdded}
          currentUserRole={currentUserRole}
        />
      )}

      {showCreateTaskModal && (
        <CreateTaskModal
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreate={handleTaskCreated}
          onTaskUpdate={handleTaskUpdate}
          group={groupId}
        />
      )}

      {showTaskModal && selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={handleCloseTaskModal}
          onTaskUpdate={handleTaskUpdate}
          onCreateSubtask={handleCreateSubtask}
          onEdit={handleTaskSelect}
          parentTaskId={parentTaskId}
          onChatUpdate={handleChatUpdate} // Передаем функцию обновления чатов
        />
      )}

      {showCreateSubtaskModal && parentTaskId && (
        <CreateSubtaskModal
          parentTaskId={parentTaskId}
          onClose={handleCloseCreateSubtaskModal}
          onSubtaskCreate={handleSubtaskCreated}
        />
      )}

      {showCategoryModal && selectedCategoryId && (
        <CategoryModal
          categoryId={selectedCategoryId}
          onClose={() => {
            setShowCategoryModal(false);
            setSelectedCategoryId(null);
          }}
          onCategoryUpdate={handleCategoryUpdate}
          group_id={groupId}
        />
      )}
    </div>
  );
};

GroupModal.propTypes = {
  groupId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onGroupUpdate: PropTypes.func,
};

export default GroupModal;
