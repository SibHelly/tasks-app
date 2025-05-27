// Измененный ChatListModal.jsx
import React from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import ChatList from "../Lists/ChatList";
import "./ChatModal.css";

const ChatListModal = ({
  chats,
  onClose,
  onChatSelect,
  groupId,
  onChatDeleted,
  currentUserRole, // Добавлен новый проп
}) => {
  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="chat-list-modal">
        <div className="modal-header-1">
          <h3>Task Discussions</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          <ChatList
            chats={chats}
            onChatSelect={onChatSelect} // Передаем функцию напрямую
            displayLimit={5}
            canEdit={false}
            groupId={groupId}
          />
        </div>
      </div>
    </div>
  );
};

ChatListModal.propTypes = {
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      chat_id: PropTypes.number.isRequired,
      chat_name: PropTypes.string.isRequired,
      created_at: PropTypes.string,
      task_id: PropTypes.number,
    })
  ),
  onClose: PropTypes.func.isRequired,
  onChatSelect: PropTypes.func.isRequired,
  groupId: PropTypes.number,
  onChatDeleted: PropTypes.func,
  currentUserRole: PropTypes.string, // Добавлен новый propType
};

export default ChatListModal;
