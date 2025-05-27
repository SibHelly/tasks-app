package types

type UserStore interface {
	GetUserByPhone(phone string) (*User, error)
	GetUserIdByName(name string) (*int, error)
	GetUserById(id int) (*User, error)
	CreateUser(User) error
}

type User struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Info     string `json:"info"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type RegisterUserPayload struct {
	Name     string `json:"name"`
	Info     string `json:"info"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type LoginUserPayload struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}
