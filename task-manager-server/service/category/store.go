package category

import (
	"database/sql"
	"fmt"

	"github.com/SibHelly/task-manager-server/types"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) GetCategories(ID int, flag bool) ([]types.Category, error) {
	var query string
	if flag {
		query =
			`SELECT c.*
        FROM categories c
        JOIN users_categories uc ON c.category_id = uc.category_id
        WHERE uc.user_id = ?`
	} else {
		query =
			`SELECT c.*
        FROM categories c
        JOIN groups_categories gc ON c.category_id = gc.category_id
        WHERE gc.group_id = ?`
	}

	rows, err := s.db.Query(query, ID)
	if err != nil {
		return nil, err
	}

	categories := make([]types.Category, 0)
	for rows.Next() {
		p, err := scanRowsIntoCategory(rows)
		if err != nil {
			return nil, err
		}

		categories = append(categories, *p)
	}

	return categories, nil

}

func (s *Store) GetCategory(ID int, category_name string, flag bool) (*types.Category, error) {
	var query string
	if flag {
		query =
			`SELECT c.*
        FROM categories c
        JOIN users_categories uc ON c.category_id = uc.category_id
        WHERE uc.user_id = ? AND c.category_name= ?`
	} else {
		query =
			`SELECT c.*
        FROM categories c
        JOIN groups_categories gc ON c.category_id = gc.category_id
        WHERE gc.group_id = ? AND c.category_name= ?`
	}

	rows, err := s.db.Query(query, ID, category_name)
	if err != nil {
		return nil, err
	}

	p := new(types.Category)
	for rows.Next() {
		p, err = scanRowsIntoCategory(rows)
		if err != nil {
			return nil, err
		}
	}
	if p.ID == 0 {
		return nil, fmt.Errorf("Category not found")
	}
	return p, nil
}

func (s *Store) GetCategoryID(ID int, category_name string, flag bool) (*int, error) {
	var query string
	if flag {
		query =
			`SELECT c.*
        FROM categories c
        JOIN users_categories uc ON c.category_id = uc.category_id
        WHERE uc.user_id = ? AND c.category_name= ?`
	} else {
		query =
			`SELECT c.*
        FROM categories c
        JOIN groups_categories gc ON c.category_id = gc.category_id
        WHERE gc.group_id = ? AND c.category_name= ?`
	}

	rows, err := s.db.Query(query, category_name)
	if err != nil {
		return nil, err
	}

	p := new(types.Category)
	for rows.Next() {
		p, err = scanRowsIntoCategory(rows)
		if err != nil {
			return nil, err
		}
	}
	if p.ID == 0 {
		return nil, fmt.Errorf("Category not found")
	}
	return &p.ID, nil
}

func (s *Store) GetCategoryByID(categoryID int) (*types.Category, error) {
	rows, err := s.db.Query("SELECT * FROM categories WHERE category_id = ?", categoryID)
	if err != nil {
		return nil, err
	}

	p := new(types.Category)
	for rows.Next() {
		p, err = scanRowsIntoCategory(rows)
		if err != nil {
			return nil, err
		}
	}
	if p.ID == 0 {
		return nil, fmt.Errorf("Category not found")
	}
	return p, nil
}

func (s *Store) CreateCategory(ID int, p types.CreateCategory, flag bool) error {
	res, err := s.db.Exec("INSERT INTO categories (category_name, description, color) VALUES (?, ?, ?)", p.Name, p.Description, p.Color)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	if flag {
		_, err = s.db.Exec("INSERT INTO users_categories (user_id, category_id) VALUES (?, ?)", ID, int64(id))
		if err != nil {
			return err
		}
		return nil
	}
	_, err = s.db.Exec("INSERT INTO groups_categories (group_id, category_id) VALUES (?, ?)", ID, int64(id))
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) DeleteCategory(categoryID int) error {
	_, err := s.db.Exec("DELETE FROM categories WHERE category_id = ?", categoryID)
	if err != nil {
		return err
	}
	_, err = s.db.Exec("DELETE FROM users_categories WHERE category_id = ?", categoryID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) UpdateCategory(categoryID int, p types.CreateCategory) error {
	_, err := s.db.Exec("UPDATE categories SET category_name = ?, description = ?, color = ? WHERE category_id = ?", p.Name, p.Description, p.Color, categoryID)
	if err != nil {
		return err
	}
	return nil
}

func scanRowsIntoCategory(rows *sql.Rows) (*types.Category, error) {
	Category := new(types.Category)

	err := rows.Scan(
		&Category.ID,
		&Category.Name,
		&Category.Description,
		&Category.Color,
	)

	if err != nil {
		return nil, err
	}

	return Category, nil
}
