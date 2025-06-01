import React, { useState } from "react";
import PropTypes from "prop-types";
import { X, Plus } from "lucide-react";
import api from "../../api/api";
import "./ChatModal.css";

const CreateChatModal = ({ groupId, taskId, onClose, onChatCreated }) => {
  const [chatName, setChatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateChat = async () => {
    if (!chatName.trim()) {
      setError("Please enter a discussion name");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await api.post("/chats/create", {
        task_id: taskId,
        group_id: groupId,
        chat_name: chatName,
      });

      if (response.data && response.data.chat.chat_id) {
        onChatCreated({
          chat_id: response.data.chat.chat_id,
          chat_name: response.data.chat.chat_name,
        });
      } else {
        throw new Error("Unexpected response format from server");
      }

      onClose();
    } catch (err) {
      console.error("Error creating chat:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to create discussion"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="create-chat-modal">
        <div className="modal-header">
          <h3>Start New Discussion</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group-1">
            {error && <div className="error-message">{error}</div>}
            <label>Discussion Name</label>
            <input
              type="text"
              value={chatName}
              onChange={(e) => {
                setChatName(e.target.value);
                setError(null);
              }}
              placeholder="Enter discussion name"
              // className="chat-name-input-1"
              className={`task-name-input ${error ? "error-input" : ""}`}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="create-button"
            onClick={handleCreateChat}
            disabled={isCreating}
          >
            {isCreating ? (
              "Creating..."
            ) : (
              <>
                <Plus size={16} /> Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

CreateChatModal.propTypes = {
  groupId: PropTypes.number.isRequired,
  taskId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onChatCreated: PropTypes.func.isRequired,
};

export default CreateChatModal;
