package category

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
	store     types.CategoryStore
	userStore types.UserStore
}

func NewHandler(store types.CategoryStore, userStore types.UserStore) *Handler {
	return &Handler{store: store, userStore: userStore}
}

func (h *Handler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/category", auth.WithJWTAuth(h.handleGetCategories, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/category", auth.WithJWTAuth(h.handleCreateCategory, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/category/group/{groupID}", auth.WithJWTAuth(h.handleGetGroupCategories, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/category/group/{groupID}", auth.WithJWTAuth(h.handleCreateGroupCategory, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/category/{categoryID}", auth.WithJWTAuth(h.handleGetCategory, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/category/{categoryID}", auth.WithJWTAuth(h.handleDeleteCategory, h.userStore)).Methods(http.MethodDelete)
	router.HandleFunc("/category/{categoryID}", auth.WithJWTAuth(h.handleUpdateCategory, h.userStore)).Methods(http.MethodPut)
}

func (h *Handler) handleCreateCategory(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	var create types.CreateCategory
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	_, err := h.store.GetCategory(userID, create.Name, true)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Category: %s already exists", create.Name))
		return
	}

	err = h.store.CreateCategory(userID, types.CreateCategory{
		Name:        create.Name,
		Description: create.Description,
		Color:       create.Color,
	}, true)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, "Created")
}

func (h *Handler) handleCreateGroupCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["groupID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing category ID"))
		return
	}

	groupID, err := strconv.Atoi(str)
	if err != nil || groupID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid category ID"))
		return
	}

	var create types.CreateCategory
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	_, err = h.store.GetCategory(groupID, create.Name, false)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Category: %s already exists", create.Name))
		return
	}

	err = h.store.CreateCategory(groupID, types.CreateCategory{
		Name:        create.Name,
		Description: create.Description,
		Color:       create.Color,
	}, false)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, "Created")
}

func (h *Handler) handleGetCategories(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	st, err := h.store.GetCategories(userID, true)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, st)
}

func (h *Handler) handleGetCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["categoryID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing category ID"))
		return
	}

	categoryID, err := strconv.Atoi(str)
	if err != nil || categoryID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid category ID"))
		return
	}

	c, err := h.store.GetCategoryByID(categoryID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status":   "Get category",
		"category": c,
	})
}

func (h *Handler) handleGetGroupCategories(w http.ResponseWriter, r *http.Request) {
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

	st, err := h.store.GetCategories(groupID, false)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, st)
}

func (h *Handler) handleUpdateCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["categoryID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing category ID"))
		return
	}

	categoryID, err := strconv.Atoi(str)
	if err != nil || categoryID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid category ID"))
		return
	}

	var create types.CreateCategory
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	err = h.store.UpdateCategory(categoryID, types.CreateCategory{
		Name:        create.Name,
		Description: create.Description,
		Color:       create.Color,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "Category updated")
}

func (h *Handler) handleDeleteCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["categoryID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing category ID"))
		return
	}

	categoryID, err := strconv.Atoi(str)
	if err != nil || categoryID == 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid category ID"))
		return
	}

	err = h.store.DeleteCategory(categoryID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, "DELETED")
}
