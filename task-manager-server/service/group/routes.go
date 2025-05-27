package group

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
	store     types.GroupStore
	userStore types.UserStore
}

func NewHandler(store types.GroupStore, userStore types.UserStore) *Handler {
	return &Handler{store: store, userStore: userStore}
}

func (h *Handler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/group", auth.WithJWTAuth(h.handleCreateGroup, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/group", auth.WithJWTAuth(h.handleGetGroups, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/group/{groupID}", auth.WithJWTAuth(h.handleGetGroup, h.userStore)).Methods(http.MethodGet)

	router.HandleFunc("/group/owner/{groupID}", auth.WithJWTAuth(h.handleGetGroupOwner, h.userStore)).Methods(http.MethodGet)

	router.HandleFunc("/group/{groupID}", auth.WithJWTAuth(h.handleUpdateGroup, h.userStore)).Methods(http.MethodPut)
	router.HandleFunc("/group/{groupID}", auth.WithJWTAuth(h.handleDeleteGroup, h.userStore)).Methods(http.MethodDelete)

	router.HandleFunc("/group/{groupID}/role", auth.WithJWTAuth(h.handleGetUserRole, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/group/{groupID}/user", auth.WithJWTAuth(h.handleUpdateUserRole, h.userStore)).Methods(http.MethodPut)

	router.HandleFunc("/group/{groupID}/add", auth.WithJWTAuth(h.handleAddUserToGroup, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/group/{groupID}/delete", auth.WithJWTAuth(h.handleDeleteUserFromGroup, h.userStore)).Methods(http.MethodDelete)
	router.HandleFunc("/group/{groupID}/users", auth.WithJWTAuth(h.handleGetUsersGroup, h.userStore)).Methods(http.MethodGet)

}

func (h *Handler) handleCreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	var create types.CreateGroup
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	_, err := h.store.GetGroupByName(create.Name)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("group: %s already exists", create.Name))
		return
	}

	err = h.store.CreateGroup(userID, types.CreateGroup{
		Name:    create.Name,
		Info:    create.Info,
		Members: create.Members,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, "Created")
}

func (h *Handler) handleGetGroups(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	g, err := h.store.GetGroups(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"status": "ok",
		"groups": g,
	})
}

func (h *Handler) handleGetGroup(w http.ResponseWriter, r *http.Request) {
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

	g, err := h.store.GetGroupByID(groupID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"status": "ok",
		"group":  g,
	})
}

func (h *Handler) handleGetGroupOwner(w http.ResponseWriter, r *http.Request) {
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

	g, err := h.store.GetGroupOwner(groupID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"status": "ok",
		"owner":  g,
	})
}

func (h *Handler) handleUpdateGroup(w http.ResponseWriter, r *http.Request) {
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

	var create types.CreateGroup
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	err = h.store.UpdateGroup(groupID, types.CreateGroup{
		Name:    create.Name,
		Info:    create.Info,
		Members: create.Members,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "Group updated")
}

func (h *Handler) handleDeleteGroup(w http.ResponseWriter, r *http.Request) {
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

	err = h.store.DeleteGroup(groupID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "Group deleted")
}

type user struct {
	ID int `json:"member_id"`
}

func (h *Handler) handleGetUserRole(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
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

	role, err := h.store.GetUserRole(groupID, userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"group_id": groupID,
		"user_id":  userID,
		"role":     role,
		"status":   "Role is get",
	})
}

func (h *Handler) handleUpdateUserRole(w http.ResponseWriter, r *http.Request) {
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

	var create types.Member
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	user_id := create.ID
	user_role := create.Role
	err = h.store.UpdateUserRole(user_id, groupID, user_role)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"group_id": groupID,
		"user_id":  user_id,
		"role":     user_role,
		"status":   "Role updated",
	})
}

func (h *Handler) handleAddUserToGroup(w http.ResponseWriter, r *http.Request) {
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

	var create types.Member
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	user_id := create.ID
	user_role := create.Role
	err = h.store.AddUser(user_id, groupID, user_role)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"group_id": groupID,
		"user_id":  user_id,
		"role":     user_role,
		"status":   "added",
	})
}

func (h *Handler) handleDeleteUserFromGroup(w http.ResponseWriter, r *http.Request) {
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

	var delete user
	if err := utils.ParseJSON(r, &delete); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	user_id := delete.ID
	err = h.store.DeleteUser(user_id, groupID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"group_id": groupID,
		"user_id":  user_id,
		"status":   "deleted",
	})
}

func (h *Handler) handleGetUsersGroup(w http.ResponseWriter, r *http.Request) {
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

	us, err := h.store.GetUsers(groupID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"group_id": groupID,
		"users":    us,
		"status":   "ok",
	})

}
