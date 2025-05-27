package chat

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/SibHelly/task-manager-server/service/auth"
	"github.com/SibHelly/task-manager-server/types"
	"github.com/SibHelly/task-manager-server/utils"
	"github.com/gorilla/mux"
)

type Handler struct {
	store        types.ChatStore
	userStore    types.UserStore
	commentStore types.CommentStore
}

func NewHandler(store types.ChatStore, commentStore types.CommentStore, userStore types.UserStore) *Handler {
	return &Handler{
		store:        store,
		commentStore: commentStore,
		userStore:    userStore,
	}
}

func (h *Handler) RegisterRoutes(router *mux.Router) {

	//получить обсуждения конкретной задачи
	router.HandleFunc("/chats/task/{taskID}", auth.WithJWTAuth(h.handleGetChats, h.userStore)).Methods(http.MethodGet)
	//получить все обсуждения конкрентной группы
	router.HandleFunc("/chats/group/{groupID}", auth.WithJWTAuth(h.handleGetChatsGroup, h.userStore)).Methods(http.MethodGet)

	router.HandleFunc("/chats/{chatID}", auth.WithJWTAuth(h.handleGetChat, h.userStore)).Methods(http.MethodGet)

	//создать чат
	router.HandleFunc("/chats/create", auth.WithJWTAuth(h.handleCreateChat, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/chats/update/{chatID}", auth.WithJWTAuth(h.handleUpdateChat, h.userStore)).Methods(http.MethodPut)
	router.HandleFunc("/chats/delete/{chatID}", auth.WithJWTAuth(h.handleDeleteChat, h.userStore)).Methods(http.MethodDelete)

	//комментарии
	router.HandleFunc("/chats/{chatID}/comments", auth.WithJWTAuth(h.handleGetCommentsFromChat, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/chats/{chatID}/comments", auth.WithJWTAuth(h.handleSendComment, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/chats/comments/{commentID}", auth.WithJWTAuth(h.handleDeleteComment, h.userStore)).Methods(http.MethodDelete)
}

func (h *Handler) handleGetChats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["taskID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing task ID"))
		return
	}

	taskID, err := strconv.Atoi(str)
	if err != nil || taskID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid task ID"))
		return
	}

	ch, err := h.store.GetChats(taskID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get chats for task",
		"Chats":  ch,
	})
}

func (h *Handler) handleGetChat(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["chatID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing chat ID"))
		return
	}

	chatID, err := strconv.Atoi(str)
	if err != nil || chatID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid chat ID"))
		return
	}

	ch, err := h.store.GetChat(chatID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get chat",
		"Chats":  ch,
	})
}

func (h *Handler) handleGetChatsGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["groupID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing group ID"))
		return
	}

	groupID, err := strconv.Atoi(str)
	if err != nil || groupID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid group ID"))
		return
	}

	ch, err := h.store.GetChatsGroup(groupID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get chats for group",
		"Chats":  ch,
	})

}

func (h *Handler) handleCreateChat(w http.ResponseWriter, r *http.Request) {
	var create types.CreateChat
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	_, err := h.store.GetChatByName(create.TaskID, create.Name)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Chat with name %s already exists for task %d ", create.Name, create.TaskID))
		return
	}

	ch, err := h.store.CreateChat(types.CreateChat{
		Name:   create.Name,
		TaskID: create.TaskID,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Chat created",
		"chat":   ch,
	})
}

func (h *Handler) handleUpdateChat(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["chatID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing chat ID"))
		return
	}

	chatID, err := strconv.Atoi(str)
	if err != nil || chatID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid chat ID"))
		return
	}

	var update types.Chat
	if err := utils.ParseJSON(r, &update); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	err = h.store.UpdateChat(chatID, update.Name)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Chat updated",
	})
}

func (h *Handler) handleDeleteChat(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["chatID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing chat ID"))
		return
	}

	chatID, err := strconv.Atoi(str)
	if err != nil || chatID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid chat ID"))
		return
	}

	err = h.store.DeleteChat(chatID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Chat deleted",
	})
}

func (h *Handler) handleGetCommentsFromChat(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["chatID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing chat ID"))
		return
	}

	chatID, err := strconv.Atoi(str)
	if err != nil || chatID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid chat ID"))
		return
	}

	comments, err := h.commentStore.GetComments(chatID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status":   "Get comments",
		"Comments": comments,
	})

}

func (h *Handler) handleSendComment(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	str, ok := vars["chatID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing chat ID"))
		return
	}

	chatID, err := strconv.Atoi(str)
	if err != nil || chatID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid chat ID"))
		return
	}

	var create types.CreateComment
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	err = h.commentStore.SendCommnet(types.CreateComment{
		ChatID:      chatID,
		SenderID:    userID,
		CommentText: create.CommentText,
	})

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Comment sended",
	})
}

func (h *Handler) handleDeleteComment(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	str, ok := vars["commentID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing comment ID"))
		return
	}

	commentID, err := strconv.Atoi(str)
	if err != nil || commentID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid comment ID"))
		return
	}

	err = h.commentStore.DeleteCommnet(commentID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Comment deleted",
	})
}
