package priority

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
	store     types.PriorityStore
	userStore types.UserStore
}

func NewHandler(store types.PriorityStore, userStore types.UserStore) *Handler {
	return &Handler{store: store, userStore: userStore}
}

func (h *Handler) RegisterRoutes(router *mux.Router) {

	router.HandleFunc("/priority", auth.WithJWTAuth(h.handleGetPriorities, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/priority", auth.WithJWTAuth(h.handleCreatePriority, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/priority/{priorityID}", auth.WithJWTAuth(h.handleDeletePriority, h.userStore)).Methods(http.MethodDelete)
	router.HandleFunc("/priority/{priorityID}", auth.WithJWTAuth(h.handleUpdatePriority, h.userStore)).Methods(http.MethodPut)
}

func (h *Handler) handleCreatePriority(w http.ResponseWriter, r *http.Request) {
	var create types.CreatePriority
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	_, err := h.store.GetPriority(create.Name)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("priority: %s already exists", create.Name))
		return
	}

	err = h.store.CreatePriority(types.CreatePriority{
		Name:  create.Name,
		Color: create.Color,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, "Priority created")
}

func (h *Handler) handleGetPriorities(w http.ResponseWriter, r *http.Request) {
	st, err := h.store.GetPriorities()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
	}

	utils.WriteJson(w, http.StatusOK, st)
}

func (h *Handler) handleUpdatePriority(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["priorityID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing priority ID"))
		return
	}

	priorityID, err := strconv.Atoi(str)
	if err != nil || priorityID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid priority ID"))
		return
	}

	var create types.CreatePriority
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	_, err = h.store.GetPriority(create.Name)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("priority: %s already exists", create.Name))
		return
	}

	err = h.store.UpdatePriority(priorityID, create)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "Priority updated")
}

func (h *Handler) handleDeletePriority(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["priorityID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing priority ID"))
		return
	}

	priorityID, err := strconv.Atoi(str)
	if err != nil || priorityID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid priority ID"))
		return
	}

	err = h.store.DeletePriority(priorityID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "Priority deleted")
}
