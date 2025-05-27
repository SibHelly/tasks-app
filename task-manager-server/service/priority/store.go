package priority

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

func (s *Store) GetPriorities() ([]types.Priority, error) {
	rows, err := s.db.Query("SELECT * FROM priority_map")
	if err != nil {
		return nil, err
	}

	priorities := make([]types.Priority, 0)
	for rows.Next() {
		p, err := scanRowsIntoPriority(rows)
		if err != nil {
			return nil, err
		}

		priorities = append(priorities, *p)
	}

	return priorities, nil

}

func (s *Store) GetPriority(priority_name string) (*types.Priority, error) {
	rows, err := s.db.Query("SELECT * FROM priority_map WHERE priority_name = ?", priority_name)
	if err != nil {
		return nil, err
	}

	p := new(types.Priority)
	for rows.Next() {
		p, err = scanRowsIntoPriority(rows)
		if err != nil {
			return nil, err
		}
	}
	if p.ID == 0 {
		return nil, fmt.Errorf("priority not found")
	}
	return p, nil
}

func (s *Store) GetPriorityByID(priorityID int) (*types.Priority, error) {
	rows, err := s.db.Query("SELECT * FROM priority_map WHERE priority_id = ?", priorityID)
	if err != nil {
		return nil, err
	}

	p := new(types.Priority)
	for rows.Next() {
		p, err = scanRowsIntoPriority(rows)
		if err != nil {
			return nil, err
		}
	}
	if p.ID == 0 {
		return nil, fmt.Errorf("priority not found")
	}
	return p, nil
}

func (s *Store) CreatePriority(p types.CreatePriority) error {
	_, err := s.db.Exec("INSERT INTO priority_map (priority_name, color) VALUES (? , ?)", p.Name, p.Color)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) DeletePriority(priorityID int) error {
	_, err := s.db.Exec("DELETE FROM priority_map WHERE priority_id = ?", priorityID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) UpdatePriority(priorityID int, p types.CreatePriority) error {
	_, err := s.db.Exec("UPDATE priority_map SET priority_name = ? , color = ? WHERE priority_id = ?", p.Name, p.Color, priorityID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) GetPriorityIDbyName(name string) (*int, error) {
	rows, err := s.db.Query("SELECT * FROM priority_map WHERE priority_name = ?", name)
	if err != nil {
		return nil, err
	}

	p := new(types.Priority)
	for rows.Next() {
		p, err = scanRowsIntoPriority(rows)
		if err != nil {
			return nil, err
		}
	}
	if p.ID == 0 {
		return nil, fmt.Errorf("priority not found")
	}

	id := p.ID
	return &id, nil
}

func scanRowsIntoPriority(rows *sql.Rows) (*types.Priority, error) {
	priority := new(types.Priority)

	err := rows.Scan(&priority.ID, &priority.Name, &priority.Color)

	if err != nil {
		return nil, err
	}

	return priority, nil
}
