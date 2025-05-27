package api

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/SibHelly/task-manager-server/service/category"
	"github.com/SibHelly/task-manager-server/service/chat"
	comments "github.com/SibHelly/task-manager-server/service/comment"
	"github.com/SibHelly/task-manager-server/service/group"
	"github.com/SibHelly/task-manager-server/service/priority"
	"github.com/SibHelly/task-manager-server/service/status"
	"github.com/SibHelly/task-manager-server/service/tasks"
	"github.com/SibHelly/task-manager-server/service/user"
	"github.com/gorilla/mux"
)

type APIServer struct {
	addr string
	db   *sql.DB
}

func NewAPIServer(addr string, db *sql.DB) *APIServer {
	return &APIServer{
		addr: addr,
		db:   db,
	}
}

// CORS Middleware
func enableCORS(router *mux.Router) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Pass request to the router
		router.ServeHTTP(w, r)
	})
}

func (s *APIServer) Run() error {
	router := mux.NewRouter()
	subrouter := router.PathPrefix("/api/v1").Subrouter()

	handler := enableCORS(router)

	userStore := user.NewStore(s.db)
	userHandler := user.NewHandler(userStore)
	userHandler.RegisterRoutes(subrouter)

	statusStore := status.NewStore(s.db)
	statusHandler := status.NewHandler(statusStore, userStore)
	statusHandler.RegisterRoutes(subrouter)

	priorityStore := priority.NewStore(s.db)
	priorityHandler := priority.NewHandler(priorityStore, userStore)
	priorityHandler.RegisterRoutes(subrouter)

	categoryStore := category.NewStore(s.db)
	categoryHandler := category.NewHandler(categoryStore, userStore)
	categoryHandler.RegisterRoutes(subrouter)

	groupStore := group.NewStore(s.db)
	groupHandler := group.NewHandler(groupStore, userStore)
	groupHandler.RegisterRoutes(subrouter)

	taskStore := tasks.NewStore(s.db)
	taskHandler := tasks.NewHandler(taskStore, userStore, priorityStore, statusStore, groupStore, categoryStore)
	taskHandler.RegisterRoutes(subrouter)

	chatStore := chat.NewStore(s.db)
	commnetStore := comments.NewStore(s.db)
	chatHandler := chat.NewHandler(chatStore, commnetStore, userStore)
	chatHandler.RegisterRoutes(subrouter)

	log.Println("Listening on", s.addr)

	return http.ListenAndServe(s.addr, handler)
}
