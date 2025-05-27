package user

import (
	"fmt"
	"net/http"

	"github.com/SibHelly/task-manager-server/config"
	"github.com/SibHelly/task-manager-server/service/auth"
	"github.com/SibHelly/task-manager-server/types"
	"github.com/SibHelly/task-manager-server/utils"
	"github.com/gorilla/mux"
)

type Handler struct {
	store types.UserStore
}

func NewHandler(store types.UserStore) *Handler {
	return &Handler{store: store}
}

func (h *Handler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/login", h.handleLogin).Methods("POST")
	router.HandleFunc("/register", h.handleRegister).Methods("POST")
	router.HandleFunc("/auth/check", auth.WithJWTAuth(h.handleCheckAuth, h.store)).Methods("GET")
	router.HandleFunc("/check/user", auth.WithJWTAuth(h.handleCheckUser, h.store)).Methods("Post")
	router.HandleFunc("/user", auth.WithJWTAuth(h.handleGetUser, h.store)).Methods("Post")
}

func (h *Handler) handleCheckAuth(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	u, err := h.store.GetUserById(userID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"user": u,
	})
}

type check struct {
	User_name string `json:"user_name"`
}

func (h *Handler) handleCheckUser(w http.ResponseWriter, r *http.Request) {
	var payload check
	if err := utils.ParseJSON(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	u, err := h.store.GetUserIdByName(payload.User_name)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"user": u,
	})

}

type user_id struct {
	ID int `json:"user_id"`
}

func (h *Handler) handleGetUser(w http.ResponseWriter, r *http.Request) {
	var payload user_id
	if err := utils.ParseJSON(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	u, err := h.store.GetUserById(payload.ID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"user": u,
	})

}

func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var payload types.LoginUserPayload
	if err := utils.ParseJSON(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	u, err := h.store.GetUserByPhone(payload.Phone)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Not found user with this phone"))
		return
	}

	if !auth.ComparePasswords(u.Password, []byte(payload.Password)) {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Invalid password"))
		return
	}

	secret := []byte(config.Envs.JWTSecret)
	token, err := auth.CreateJWT(secret, u.ID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]string{"token": token})
}

func (h *Handler) handleRegister(w http.ResponseWriter, r *http.Request) {
	var payload types.RegisterUserPayload
	if err := utils.ParseJSON(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	_, err := h.store.GetUserByPhone(payload.Phone)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("User with %s already exists", payload.Phone))
		return
	}

	hashedPassword, err := auth.HashPassword(payload.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	err = h.store.CreateUser(types.User{
		Name:     payload.Name,
		Info:     payload.Info,
		Phone:    payload.Phone,
		Password: hashedPassword,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, nil)
}
