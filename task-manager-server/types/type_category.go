package types

type CategoryStore interface {
	GetCategories(userID int, flag bool) ([]Category, error)
	CreateCategory(userID int, category CreateCategory, flag bool) error
	DeleteCategory(categoryID int) error
	UpdateCategory(categoryID int, p CreateCategory) error
	GetCategory(ID int, category string, flag bool) (*Category, error)
	GetCategoryID(ID int, category string, flag bool) (*int, error)
	GetCategoryByID(categoryID int) (*Category, error)
}

type Category struct {
	ID          int    `json:"category_id"`
	Name        string `json:"category_name"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

type CreateCategory struct {
	Name        string `json:"category_name"`
	Description string `json:"description"`
	Color       string `json:"color"`
}
