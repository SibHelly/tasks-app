package types

type StatusStore interface {
	GetStatuses() ([]Status, error)
	CreateStatus(CreateStatus) error
	DeleteStatus(statusID int) error
	UpdateStatus(statusID int, st CreateStatus) error
	GetStatus(status string) (*Status, error)
	GetStatusByID(statusID int) (*Status, error)
	GetStatusIDbyName(name string) (*int, error)
}

type Status struct {
	ID     int    `json:"status_id"`
	Status string `json:"status"`
}
type CreateStatus struct {
	Status string `json:"status"`
}