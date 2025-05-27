package status

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
	store     types.StatusStore
	userStore types.UserStore
}

func NewHandler(store types.StatusStore, userStore types.UserStore) *Handler {
	return &Handler{store: store, userStore: userStore}
}

func (h *Handler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/statuses", auth.WithJWTAuth(h.handleGetStatuses, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/statuses", auth.WithJWTAuth(h.handleCreateStatus, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/statuses/{statusID}", auth.WithJWTAuth(h.handleDeleteStatus, h.userStore)).Methods(http.MethodDelete)
	router.HandleFunc("/statuses/{statusID}", auth.WithJWTAuth(h.handleUpdateStatus, h.userStore)).Methods(http.MethodPut)
}

func (h *Handler) handleCreateStatus(w http.ResponseWriter, r *http.Request) {
	var create types.CreateStatus
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// check this status
	_, err := h.store.GetStatus(create.Status)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("status: %s already exists", create.Status))
		return
	}

	err = h.store.CreateStatus(types.CreateStatus{
		Status: create.Status,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, "Created")
}

func (h *Handler) handleGetStatuses(w http.ResponseWriter, r *http.Request) {
	st, err := h.store.GetStatuses()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
	}

	utils.WriteJson(w, http.StatusOK, st)
}

func (h *Handler) handleUpdateStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["statusID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing status ID"))
		return
	}

	statusID, err := strconv.Atoi(str)
	if err != nil || statusID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid status ID"))
		return
	}

	var create types.CreateStatus
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	_, err = h.store.GetStatus(create.Status)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("status: %s already exists", create.Status))
		return
	}

	err = h.store.UpdateStatus(statusID, create)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "UPDATED")
}

func (h *Handler) handleDeleteStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["statusID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing status ID"))
		return
	}

	statusID, err := strconv.Atoi(str)
	if err != nil || statusID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid status ID"))
		return
	}

	err = h.store.DeleteStatus(statusID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "DELETED")
}
