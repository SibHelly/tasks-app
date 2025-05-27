package group

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

func (s *Store) CreateGroup(userID int, g types.CreateGroup) error {
	res, err := s.db.Exec("INSERT INTO `groups` (group_name, group_info) VALUES (? , ?)", g.Name, g.Info)
	if err != nil {
		return err
	}
	owner := types.Member{ID: userID, Role: "owner"}
	g.Members = append(g.Members, owner)
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	for _, m := range g.Members {
		_, err = s.db.Exec("INSERT IGNORE INTO inclusions (user_id, group_id, role) VALUES (?, ?, ?)", m.ID, int64(id), m.Role)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Store) GetGroupIdByName(name string) (*int, error) {
	rows, err := s.db.Query("SELECT * FROM `groups` WHERE group_name = ?", name)
	if err != nil {
		return nil, err
	}

	g := new(types.Group)
	for rows.Next() {
		g, err = scanRowsIntoGroups(rows)
		if err != nil {
			return nil, err
		}
	}
	if g.ID == 0 {
		return nil, nil
	}
	return &g.ID, nil
}

func (s *Store) GetGroupOwner(group_id int) (string, error) {
	query := `SELECT u.name 
    FROM users u 
    JOIN inclusions i ON u.user_id = i.user_id 
    JOIN ` + "`groups`" + ` g ON i.group_id = g.group_id 
    WHERE i.role = 'owner' AND g.group_id = ?`

	rows := s.db.QueryRow(query, group_id)

	var owner string
	err := rows.Scan(&owner)
	if err != nil {
		return "", err
	}

	return owner, nil
}

func (s *Store) GetGroupByName(name string) (*types.Group, error) {
	rows, err := s.db.Query("SELECT * FROM `groups` WHERE group_name = ?", name)
	if err != nil {
		return nil, err
	}

	g := new(types.Group)
	for rows.Next() {
		g, err = scanRowsIntoGroups(rows)
		if err != nil {
			return nil, err
		}
	}
	if g.ID == 0 {
		return nil, fmt.Errorf("group not found")
	}
	return g, nil
}

func (s *Store) GetGroupByID(group_id int) (*types.Group, error) {
	rows, err := s.db.Query("SELECT * FROM `groups` WHERE group_id = ?", group_id)
	if err != nil {
		return nil, err
	}

	g := new(types.Group)
	for rows.Next() {
		g, err = scanRowsIntoGroups(rows)
		if err != nil {
			return nil, err
		}
	}
	if g.ID == 0 {
		return nil, fmt.Errorf("group not found")
	}
	return g, nil
}

func (s *Store) GetGroups(userID int) ([]types.Group, error) {
	query := `
    SELECT g.group_id, g.group_name, g.group_info
    FROM ` + "`groups`" + ` g
    JOIN inclusions i ON g.group_id = i.group_id
    WHERE i.user_id = ?`
	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}

	groups := make([]types.Group, 0)
	for rows.Next() {
		p, err := scanRowsIntoGroups(rows)
		if err != nil {
			return nil, err
		}

		groups = append(groups, *p)

	}
	return groups, nil
}

func (s *Store) UpdateGroup(group_id int, g types.CreateGroup) error {
	_, err := s.db.Exec("UPDATE `groups` SET group_name = ?, group_info = ? WHERE group_id = ?", g.Name, g.Info, group_id)
	if err != nil {
		return err
	}

	query := `
        INSERT INTO inclusions (user_id, group_id, role) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE role = VALUES(role)
    `
	for _, m := range g.Members {
		_, err = s.db.Exec(query, m.ID, group_id, m.Role)
		if err != nil {
			return err
		}
	}
	return nil
}
func (s *Store) DeleteGroup(group_id int) error {
	_, err := s.db.Exec("DELETE FROM `groups` WHERE group_id = ?", group_id)
	if err != nil {
		return err
	}
	_, err = s.db.Exec("DELETE  FROM inclusions WHERE group_id = ?", group_id)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) AddUser(user_id, group_id int, role string) error {

	if role == "" {
		role = "user"
	}

	_, err := s.db.Exec("INSERT INTO inclusions (user_id, group_id, role) VALUES (?, ?, ?)", user_id, group_id, role)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) UpdateUserRole(user_id, group_id int, role string) error {

	if role == "" {
		role = "user"
	}

	_, err := s.db.Exec("UPDATE inclusions SET role = ? WHERE group_id = ? AND user_id = ?", role, group_id, user_id)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) GetUserRole(group_id, user_id int) (string, error) {

	query := `SELECT i.role 
    FROM users u 
    JOIN inclusions i ON u.user_id = i.user_id 
    JOIN ` + "`groups`" + ` g ON i.group_id = g.group_id 
    WHERE i.user_id = ? AND g.group_id = ?`
	row := s.db.QueryRow(query, user_id, group_id)

	var role string
	err := row.Scan(&role)
	if err != nil {
		return "", err
	}

	return role, nil

}

func (s *Store) GetUsers(group_id int) ([]types.UsersGroup, error) {
	query := `
		SELECT u.user_id, u.name, u.phone, i.role 
		FROM users u
		JOIN inclusions i ON u.user_id = i.user_id
		WHERE i.group_id = ?`
	rows, err := s.db.Query(query, group_id)
	if err != nil {
		return nil, err
	}

	users := make([]types.UsersGroup, 0)
	for rows.Next() {
		u, err := scanRowsIntoGroupUsers(rows)
		if err != nil {
			return nil, err
		}

		users = append(users, *u)

	}
	return users, nil

}

func (s *Store) DeleteUser(user_id, group_id int) error {
	_, err := s.db.Exec("DELETE FROM inclusions WHERE group_id = ? AND user_id = ?", group_id, user_id)
	if err != nil {
		return err
	}
	return nil
}

func scanRowsIntoGroups(rows *sql.Rows) (*types.Group, error) {
	g := new(types.Group)

	err := rows.Scan(&g.ID, &g.Name, &g.Info)

	if err != nil {
		return nil, err
	}

	return g, nil
}

func scanRowsIntoGroupUsers(rows *sql.Rows) (*types.UsersGroup, error) {
	u := new(types.UsersGroup)

	err := rows.Scan(&u.ID, &u.Name, &u.Phone, &u.Role)

	if err != nil {
		return nil, err
	}

	return u, nil
}
