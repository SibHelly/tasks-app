import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { X, Send, Trash2 } from "lucide-react";
import api from "../../api/api";
import "./ChatModal.css";

const ChatModal = ({ chatId, onClose, onChatDeleted, currentUserRole }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userCache, setUserCache] = useState({});

  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Функция для загрузки данных о пользователе
  const fetchUserData = useCallback(
    async (userId) => {
      // Проверяем, есть ли пользователь уже в кеше
      if (userCache[userId]) {
        return userCache[userId];
      }

      try {
        const response = await api.post(`/user`, { user_id: userId });
        const userData = response.data.user;

        // Обновляем кеш пользователей
        setUserCache((prev) => ({
          ...prev,
          [userId]: userData,
        }));

        return userData;
      } catch (err) {
        console.error(`Error fetching user data for ID ${userId}:`, err);
        return null;
      }
    },
    [userCache]
  );

  // Функция для загрузки комментариев с обогащением данными о пользователях
  const fetchMessages = useCallback(async () => {
    try {
      // Получаем комментарии
      const messagesResponse = await api.get(`/chats/${chatId}/comments`);
      const fetchedComments = messagesResponse.data.Comments || [];

      // Для каждого комментария загружаем информацию о пользователе
      const enrichedComments = await Promise.all(
        fetchedComments.map(async (comment) => {
          if (!comment.sender_id) return comment;

          const userData = await fetchUserData(comment.sender_id);

          return {
            ...comment,
            user: userData.name,
          };
        })
      );

      setMessages(enrichedComments);
    } catch (err) {
      console.error("Error fetching messages:", err);
      // Не устанавливаем ошибку для всего компонента, просто логируем
    }
  }, [chatId, fetchUserData]);

  // Инициализация чата при монтировании компонента
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);

        // Загружаем данные чата
        const chatResponse = await api.get(`/chats/${chatId}`);
        setChat(chatResponse.data.Chats);

        // Загружаем сообщения
        await fetchMessages();

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing chat:", err);
        setError({
          message: "Failed to load chat",
          details: err.response?.data?.error,
        });
        setIsLoading(false);
      }
    };

    initializeChat();

    // Устанавливаем интервал для автоматического обновления комментариев
    intervalRef.current = setInterval(() => {
      fetchMessages();
    }, 10000); // каждые 10 секунд

    // Очистка при размонтировании
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [chatId, fetchMessages]);

  // Прокрутка вниз при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await api.post(`/chats/${chatId}/comments`, {
        comment: newMessage,
      });

      setNewMessage("");

      // Обновляем список сообщений сразу после отправки
      await fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await api.delete(`/chats/comments/${commentId}`);
        // Refresh messages after deletion
        await fetchMessages();
      } catch (err) {
        console.error("Error deleting comment:", err);
        alert("Failed to delete message");
      }
    }
  };

  const handleDeleteChat = async () => {
    if (window.confirm("Are you sure you want to delete this discussion?")) {
      try {
        setIsDeleting(true);
        await api.delete(`/chats/delete/${chatId}`);

        // Вызываем обновление списка в родительском компоненте перед закрытием
        onChatDeleted(chatId);
        onClose();
      } catch (err) {
        console.error("Error deleting chat:", err);
        alert("Failed to delete discussion");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-loading">Loading discussion...</div>
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

  if (!chat) {
    return (
      <div className="modal-overlay modal-overlay-blur">
        <div className="modal-error">Discussion not found</div>
      </div>
    );
  }

  return (
    <div className="modal-overlay modal-overlay-blur">
      <div className="chat-modal">
        <div className="modal-header">
          <h3>{chat.chat_name}</h3>
          <div className="header-actions">
            {currentUserRole !== "member" && (
              <button
                className="delete-chat-button"
                onClick={handleDeleteChat}
                disabled={isDeleting}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="chat-content-1">
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.comment_id || message.message_id}
                className="message"
              >
                <div className="message-header">
                  <div className="message-text">
                    {message.comment || message.message}
                  </div>
                  <div className="msg">
                    <span className="message-sender">
                      {message.user || "Unknown"}
                    </span>
                    {currentUserRole !== "member" && (
                      <button
                        className="delete-comment-button"
                        onClick={() => handleDeleteComment(message.comment_id)}
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}{" "}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="input-comment"
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ChatModal.propTypes = {
  chatId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onChatDeleted: PropTypes.func.isRequired,
  currentUserRole: PropTypes.string,
};

export default ChatModal;
