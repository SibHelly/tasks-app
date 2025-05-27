package types

import (
	"time"
)

type TasksStore interface {
	GetTasks(ID int, flag bool) ([]Task, error)
	GetSubTasks(ID int) ([]Task, error)
	GetAllTasksUser(ID int) ([]Task, error)
	GetMostPriorityTasks(ID int) ([]Task, error)

	CreateTask(t CreateTask) error
	AddSubtask(t CreateTask) error

	UpdateTask(t Task) error
	UpdateTaskStatus(id, statusId int) error
	FinishTask(ID int) error
	DeleteTask(task_id int) error

	GetTaskByName(name string, ID int, flag bool) (*Task, error)
	GetTaskIdByName(name string, ID int, flag bool) (*int, error)
	GetSubtaskByName(ParentID int, subtask_name string) (*Task, error)
	GetResponsible(ID int) ([]ResponsibleUserID, error)
	GetTaskByID(ID int) (*Task, error)
}

type Task struct {
	ID             int       `json:"task_id"`
	Name           string    `json:"task_name"`
	Description    string    `json:"task_description"`
	Priority_id    int       `json:"priority_id"`
	Status_id      int       `json:"status_id"`
	StartTime      time.Time `json:"start_time"`
	EndTime        time.Time `json:"end_time"`
	Attachments    string    `json:"attachments"`
	Category_id    int       `json:"category_id"`
	Parent_task_id int       `json:"parent_task_id"`
	Group_id       int       `json:"group_id"`
}

type CreateTask struct {
	Name           string              `json:"task_name"`
	Description    string              `json:"task_description"`
	Priority_id    int                 `json:"priority_id"`
	Status_id      int                 `json:"status_id"`
	StartTime      time.Time           `json:"start_time"`
	EndTime        time.Time           `json:"end_time"`
	Attachments    string              `json:"attachments"`
	Category_id    int                 `json:"category_id"`
	Parent_task_id int                 `json:"parent_task_id"`
	Group_id       int                 `json:"group_id"`
	Responsible    []ResponsibleUserID `json:"responsible_users_id"`
	Subtasks       []CreateTask        `json:"subtasks"`
}

type TaskFull struct {
	Name           string            `json:"task_name"`
	Description    string            `json:"task_description"`
	Priority_id    string            `json:"priority_id"`
	Status_id      string            `json:"status_id"`
	StartTime      time.Time         `json:"start_time"`
	EndTime        time.Time         `json:"end_time"`
	Attachments    string            `json:"attachments"`
	Category_id    string            `json:"category_id"`
	Parent_task_id string            `json:"parent_task_id"`
	Group_id       string            `json:"group_id"`
	Responsible    []ResponsibleUser `json:"responsible_users"`
	Subtasks       []TaskFull        `json:"subtasks"`
}

type ResponsibleUserID struct {
	ID int64 `json:"responsible_id"`
}

type ResponsibleUser struct {
	Name string `json:"responsible_name"`
}

type CreateSubtask struct {
	Name           string `json:"task_name"`
	Description    string `json:"task_description"`
	Priority_id    int    `json:"priority_id"`
	Status_id      int    `json:"status_id"`
	Parent_task_id int    `json:"parent_task_id"`
}
