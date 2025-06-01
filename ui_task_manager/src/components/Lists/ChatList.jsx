import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../api/api";
import { MessageSquare, Trash2, ChevronDown, Edit, X } from "lucide-react";
import "./ChatList.css";
import ChatModal from "../Modals/ChatModal";

const ChatList = ({
  chats = [], // Default value
  isLoading = false,
  error = null,
  onChatSelect,
  onChatUpdate,
  displayLimit = null,
  canEdit = false,
  groupId,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedChatName, setEditedChatName] = useState("");
  const [taskNames, setTaskNames] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");

  const fetchTaskName = async (taskId) => {
    if (!taskId) return `Task ${taskId}`;

    try {
      const response = await api.get(`/tasks/get/${taskId}`);
      if (response.data && response.data.tasks) {
        return response.data.tasks.task_name;
      }
      return `Task ${taskId}`;
    } catch (err) {
      console.error("Error fetching task name:", err);
      return `Task ${taskId}`;
    }
  };

  useEffect(() => {
    const fetchAllTaskNames = async () => {
      if (!Array.isArray(chats)) return;

      const names = {};
      const fetchPromises = [];

      for (const chat of chats) {
        if (chat?.task_id && !taskNames[chat.task_id]) {
          fetchPromises.push(
            fetchTaskName(chat.task_id).then((name) => {
              names[chat.task_id] = name;
            })
          );
        }
      }

      await Promise.all(fetchPromises);

      if (Object.keys(names).length > 0) {
        setTaskNames((prev) => ({ ...prev, ...names }));
      }
    };

    fetchAllTaskNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]); // Removed taskNames from dependencies

  const handleChatInfo = (chatId) => {
    if (!canEdit) {
      setCurrentUserRole("member");
    }
    setSelectedChatId(chatId);
    setShowChatModal(true);

    if (onChatSelect) {
      onChatSelect(chatId);
    }
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setSelectedChatId(null);
  };

  const handleChatDeleted = async () => {
    if (onChatUpdate) {
      await onChatUpdate();
    }
    setShowChatModal(false);
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm("Are you sure you want to delete this discussion?")) {
      try {
        await api.delete(`/chats/delete/${chatId}`);
        if (onChatUpdate) {
          await onChatUpdate();
        }
      } catch (err) {
        console.error("Error deleting chat:", err);
        alert("Error deleting discussion");
      }
    }
  };

  const handleSaveChatName = async (chatId) => {
    try {
      await api.put(`/chats/update/${chatId}`, {
        chat_name: editedChatName,
      });
      setEditingChatId(null);
      if (onChatUpdate) {
        await onChatUpdate();
      }
    } catch (err) {
      console.error("Error updating chat:", err);
      alert("Error updating discussion");
    }
  };

  const handleStartEditing = (chat) => {
    if (!chat) return;
    setEditingChatId(chat.chat_id);
    setEditedChatName(chat.chat_name);
  };

  const handleCancelEditing = () => {
    setEditingChatId(null);
    setEditedChatName("");
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const displayedChats = Array.isArray(chats)
    ? displayLimit && !showAll
      ? chats.slice(0, displayLimit)
      : chats
    : [];

  if (isLoading) return <div className="loading">Loading discussions...</div>;
  if (error)
    return (
      <div className="error">
        Error: {error.message || "Failed to load discussions"}
      </div>
    );
  if (!Array.isArray(chats) || chats.length === 0)
    return <div className="empty">No discussions found</div>;

  return (
    <div className="chat-list">
      {displayedChats.map((chat) => (
        <React.Fragment key={chat.chat_id}>
          <div className="chat-item">
            <div className="chat-content">
              <div className="chat-name">
                <div className="chat-icon">
                  <MessageSquare size={16} />
                </div>
                {editingChatId === chat.chat_id ? (
                  <input
                    type="text"
                    value={editedChatName}
                    onChange={(e) => setEditedChatName(e.target.value)}
                    className="chat-name-input"
                  />
                ) : (
                  <span>{chat.chat_name}</span>
                )}
                {chat.task_id && (
                  <div className="task-tag">
                    Task: {taskNames[chat.task_id] || `Task ${chat.task_id}`}
                  </div>
                )}
              </div>
              <div className="chat-actions">
                {canEdit && editingChatId === chat.chat_id ? (
                  <>
                    <button
                      className="save-button"
                      onClick={() => handleSaveChatName(chat.chat_id)}
                    >
                      <Edit size={16} />
                      <span>SAVE</span>
                    </button>
                    <button
                      className="cancel-button"
                      onClick={handleCancelEditing}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="info-button-2"
                      onClick={() => handleChatInfo(chat.chat_id)}
                    >
                      <span>OPEN</span>
                    </button>
                    {canEdit && (
                      <>
                        <button
                          className="edit-button"
                          onClick={() => handleStartEditing(chat)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteChat(chat.chat_id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}

      {Array.isArray(chats) && displayLimit && chats.length > displayLimit && (
        <div className="show-all-container">
          <button className="show-all-button" onClick={toggleShowAll}>
            <ChevronDown size={16} />
            {showAll ? "Show less" : `Show all (${chats.length})`}
          </button>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedChatId && (
        <ChatModal
          chatId={selectedChatId}
          onClose={handleCloseChatModal}
          onChatDeleted={handleChatDeleted}
          groupId={groupId}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
};

ChatList.propTypes = {
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      chat_id: PropTypes.number.isRequired,
      task_id: PropTypes.number,
      chat_name: PropTypes.string.isRequired,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onChatSelect: PropTypes.func,
  onChatUpdate: PropTypes.func,
  displayLimit: PropTypes.number,
  canEdit: PropTypes.bool,
};

export default ChatList;
