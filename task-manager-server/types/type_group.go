package types

type GroupStore interface {
	CreateGroup(userID int, g CreateGroup) error
	UpdateGroup(group_id int, g CreateGroup) error
	DeleteGroup(group_id int) error
	GetGroups(userID int) ([]Group, error)
	GetGroupByName(name string) (*Group, error)
	GetGroupIdByName(name string) (*int, error)
	GetGroupByID(group_id int) (*Group, error)
	AddUser(user_id, group_id int, role string) error
	GetUsers(group_id int) ([]UsersGroup, error)
	DeleteUser(user_id, group_id int) error
	GetGroupOwner(group_id int) (string, error)
	GetUserRole(group_id, user_id int) (string, error)
	UpdateUserRole(user_id, group_id int, role string) error
}

type Group struct {
	ID   int    `json:"group_id"`
	Name string `json:"group_name"`
	Info string `json:"info"`
}

type CreateGroup struct {
	Name    string   `json:"group_name"`
	Info    string   `json:"info"`
	Members []Member `json:"members"`
}

type Member struct {
	ID   int    `json:"member_id"`
	Role string `json:"role"`
}

type UsersGroup struct {
	ID    int    `json:"member_id"`
	Name  string `json:"name"`
	Role  string `json:"role"`
	Info  string `json:"info"`
	Phone string `json:"phone"`
}
