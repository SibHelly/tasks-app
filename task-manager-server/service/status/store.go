package status

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

func (s *Store) GetStatuses() ([]types.Status, error) {
	rows, err := s.db.Query("SELECT * FROM status_map")
	if err != nil {
		return nil, err
	}

	statuses := make([]types.Status, 0)
	for rows.Next() {
		p, err := scanRowsIntoStatus(rows)
		if err != nil {
			return nil, err
		}

		statuses = append(statuses, *p)
	}

	return statuses, nil

}

func (s *Store) GetStatus(status string) (*types.Status, error) {
	rows, err := s.db.Query("SELECT * FROM status_map WHERE status = ?", status)
	if err != nil {
		return nil, err
	}

	st := new(types.Status)
	for rows.Next() {
		st, err = scanRowsIntoStatus(rows)
		if err != nil {
			return nil, err
		}
	}
	if st.ID == 0 {
		return nil, fmt.Errorf("status not found")
	}
	return st, nil
}
func (s *Store) GetStatusByID(statusID int) (*types.Status, error) {
	rows, err := s.db.Query("SELECT * FROM status_map WHERE status_id = ?", statusID)
	if err != nil {
		return nil, err
	}

	st := new(types.Status)
	for rows.Next() {
		st, err = scanRowsIntoStatus(rows)
		if err != nil {
			return nil, err
		}
	}
	if st.ID == 0 {
		return nil, fmt.Errorf("status not found")
	}
	return st, nil
}

func (s *Store) GetStatusIDbyName(name string) (*int, error) {
	rows, err := s.db.Query("SELECT * FROM status_map WHERE status = ?", name)
	if err != nil {
		return nil, err
	}

	st := new(types.Status)
	for rows.Next() {
		st, err = scanRowsIntoStatus(rows)
		if err != nil {
			return nil, err
		}
	}
	if st.ID == 0 {
		return nil, nil
	}
	return &st.ID, nil
}

func (s *Store) CreateStatus(st types.CreateStatus) error {
	_, err := s.db.Exec("INSERT INTO status_map (status) VALUES (?)", st.Status)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) DeleteStatus(statusID int) error {
	_, err := s.db.Exec("DELETE FROM status_map WHERE status_id = ?", statusID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) UpdateStatus(statusID int, st types.CreateStatus) error {
	_, err := s.db.Exec("UPDATE status_map SET status = ? WHERE status_id = ?", st.Status, statusID)
	if err != nil {
		return err
	}
	return nil
}

func scanRowsIntoStatus(rows *sql.Rows) (*types.Status, error) {
	status := new(types.Status)

	err := rows.Scan(&status.ID, &status.Status)

	if err != nil {
		return nil, err
	}

	return status, nil
}
