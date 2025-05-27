package types

type PriorityStore interface {
	GetPriorities() ([]Priority, error)
	CreatePriority(CreatePriority) error
	DeletePriority(priorityID int) error
	UpdatePriority(priorityID int, p CreatePriority) error
	GetPriority(priority string) (*Priority, error)
	GetPriorityByID(priorityID int) (*Priority, error)
	GetPriorityIDbyName(name string) (*int, error)
}

type Priority struct {
	ID    int    `json:"priority_id"`
	Name  string `json:"priority_name"`
	Color string `json:"color"`
}

type CreatePriority struct {
	Name  string `json:"priority_name"`
	Color string `json:"color"`
}
