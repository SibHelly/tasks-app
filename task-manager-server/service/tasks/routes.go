package tasks

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
	store         types.TasksStore
	userStore     types.UserStore
	priorityStore types.PriorityStore
	statusStore   types.StatusStore
	groupStore    types.GroupStore
	categoryStore types.CategoryStore
}

func NewHandler(
	store types.TasksStore,
	userStore types.UserStore,
	priorityStore types.PriorityStore,
	statusStore types.StatusStore,
	groupStore types.GroupStore,
	categoryStore types.CategoryStore,
) *Handler {
	return &Handler{
		store:         store,
		userStore:     userStore,
		priorityStore: priorityStore,
		statusStore:   statusStore,
		groupStore:    groupStore,
		categoryStore: categoryStore,
	}
}

func (h *Handler) RegisterRoutes(router *mux.Router) {

	//get tasks for user and group
	router.HandleFunc("/tasks", auth.WithJWTAuth(h.handleGetTasks, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/tasks/not-group", auth.WithJWTAuth(h.handleGetTasksUser, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/tasks/most-priority", auth.WithJWTAuth(h.handleGetMostPriorityTasksUser, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/tasks/group/{groupID}", auth.WithJWTAuth(h.handleGetTasksGroup, h.userStore)).Methods(http.MethodGet)

	// create task
	router.HandleFunc("/tasks/create", auth.WithJWTAuth(h.handleCreateTask, h.userStore)).Methods(http.MethodPost)
	router.HandleFunc("/tasks/createSubtask", auth.WithJWTAuth(h.handleCreateSubtask, h.userStore)).Methods(http.MethodPost)

	router.HandleFunc("/tasks/finish/{taskID}", auth.WithJWTAuth(h.handleFinishTask, h.userStore)).Methods(http.MethodPut)
	router.HandleFunc("/tasks/get/{taskID}", auth.WithJWTAuth(h.handleGetTask, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/tasks/get/subtasks/{taskID}", auth.WithJWTAuth(h.handleGetSubtasks, h.userStore)).Methods(http.MethodGet)
	router.HandleFunc("/tasks/update/{taskID}", auth.WithJWTAuth(h.handleUpdateTask, h.userStore)).Methods(http.MethodPut)
	router.HandleFunc("/tasks/update/status/{taskID}", auth.WithJWTAuth(h.handleUpdateTaskStatus, h.userStore)).Methods(http.MethodPut)
	router.HandleFunc("/tasks/delete/{taskID}", auth.WithJWTAuth(h.handleDeleteTask, h.userStore)).Methods(http.MethodDelete)
}

func (h *Handler) handleGetTasks(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	ts, err := h.store.GetAllTasksUser(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get all tasks user",
		"tasks":  ts,
	})
}

func (h *Handler) handleGetTasksUser(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	ts, err := h.store.GetTasks(userID, true)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get tasks user",
		"tasks":  ts,
	})
}

func (h *Handler) handleGetMostPriorityTasksUser(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	ts, err := h.store.GetMostPriorityTasks(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get most priority tasks user",
		"tasks":  ts,
	})
}

func (h *Handler) handleGetTasksGroup(w http.ResponseWriter, r *http.Request) {
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
	ts, err := h.store.GetTasks(groupID, false)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get tasks group",
		"tasks":  ts,
	})
}

func (h *Handler) handleFinishTask(w http.ResponseWriter, r *http.Request) {
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

	err = h.store.FinishTask(taskID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Task finished",
	})
}

func (h *Handler) handleGetTask(w http.ResponseWriter, r *http.Request) {
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

	ts, err := h.store.GetTaskByID(taskID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get tasks user",
		"tasks":  ts,
	})
}

func (h *Handler) handleGetSubtasks(w http.ResponseWriter, r *http.Request) {
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

	ts, err := h.store.GetSubTasks(taskID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Get subtasks",
		"tasks":  ts,
	})
}

func (h *Handler) handleCreateTask(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	var create types.CreateTask
	if err := utils.ParseJSON(r, &create); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	Responsible := make([]types.ResponsibleUserID, 0)
	if create.Group_id == 0 {
		// fmt.Println("user task")
		_, err := h.store.GetTaskByName(create.Name, userID, true)
		if err == nil {
			utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Task: %s already exists in your list tasks", create.Name))
			return
		}

		Responsible = append(Responsible, types.ResponsibleUserID{ID: int64(userID)})
	} else {
		// fmt.Println("group task")
		_, err := h.store.GetTaskByName(create.Name, create.Group_id, false)
		if err == nil {
			utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Task: %s already exists in this group", create.Name))
			return
		}
		for _, m := range create.Responsible {
			Responsible = append(Responsible, m)
		}

		if len(Responsible) == 0 {
			utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Group task: %s must have responsible user", create.Name))
			return
		}

	}
	err := h.store.CreateTask(types.CreateTask{
		Name:           create.Name,
		Description:    create.Description,
		Priority_id:    create.Priority_id,
		Status_id:      create.Status_id,
		StartTime:      create.StartTime,
		EndTime:        create.EndTime,
		Attachments:    create.Attachments,
		Category_id:    create.Category_id,
		Parent_task_id: create.Parent_task_id,
		Responsible:    Responsible,
		Subtasks:       create.Subtasks,
		Group_id:       create.Group_id,
	})
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Task created",
	})
}

func (h *Handler) handleCreateSubtask(w http.ResponseWriter, r *http.Request) {
	var createSubtask types.CreateSubtask
	if err := utils.ParseJSON(r, &createSubtask); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	ts, err := h.store.GetTaskByID(createSubtask.Parent_task_id)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	_, err = h.store.GetSubtaskByName(createSubtask.Parent_task_id, createSubtask.Name)
	if err == nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("Subtask: %s already exists in this subtasks list", createSubtask.Name))
		return
	}

	Responsible, err := h.store.GetResponsible(ts.ID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	err = h.store.AddSubtask(types.CreateTask{
		Name:           createSubtask.Name,
		Description:    createSubtask.Description,
		Priority_id:    createSubtask.Priority_id,
		Status_id:      createSubtask.Status_id,
		StartTime:      ts.StartTime,
		EndTime:        ts.EndTime,
		Attachments:    ts.Attachments,
		Category_id:    ts.Category_id,
		Parent_task_id: createSubtask.Parent_task_id,
		Responsible:    Responsible,
		Group_id:       ts.Group_id,
	})

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Subtask added",
	})
}

func (h *Handler) handleUpdateTask(w http.ResponseWriter, r *http.Request) {
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

	var update types.Task
	if err := utils.ParseJSON(r, &update); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	err = h.store.UpdateTask(types.Task{
		ID:             taskID,
		Name:           update.Name,
		Description:    update.Description,
		Priority_id:    update.Priority_id,
		Status_id:      update.Status_id,
		StartTime:      update.StartTime,
		EndTime:        update.EndTime,
		Attachments:    update.Attachments,
		Category_id:    update.Category_id,
		Parent_task_id: update.Parent_task_id,
		Group_id:       update.Group_id,
	})

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Task updated",
	})
}

type task_status struct {
	Id int `json:"status_id"`
}

func (h *Handler) handleUpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	str, ok := vars["taskID"]
	if !ok {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("missing task ID"))
		return
	}

	taskID, err := strconv.Atoi(str)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid task ID"))
		return
	}

	var st task_status
	if err := utils.ParseJSON(r, &st); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	err = h.store.UpdateTaskStatus(taskID, st.Id)

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status": "Task updated",
	})
}

func (h *Handler) handleDeleteTask(w http.ResponseWriter, r *http.Request) {
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

	err = h.store.DeleteTask(taskID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"Status":  "Task deleted",
		"Task id": taskID,
	})
}
