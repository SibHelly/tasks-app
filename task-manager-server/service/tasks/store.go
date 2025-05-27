package tasks

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/SibHelly/task-manager-server/types"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) GetTasks(ID int, flag bool) ([]types.Task, error) {
	var query string
	if flag {
		query = `SELECT t.* FROM tasks t
		JOIN do_users du ON t.task_id = du.task_id
		WHERE du.user_id = ?
		`
	} else {
		query = `SELECT t.* FROM tasks t
		WHERE t.group_id = ?
		`
	}

	rows, err := s.db.Query(query, ID)
	if err != nil {
		return nil, err
	}

	tasks := make([]types.Task, 0)
	for rows.Next() {
		p, err := scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}

		tasks = append(tasks, *p)
	}

	return tasks, nil
}

func (s *Store) GetAllTasksUser(ID int) ([]types.Task, error) {
	query := `SELECT t.* FROM tasks t
		JOIN do_users du ON t.task_id = du.task_id
		WHERE du.user_id = ?
		`
	rows, err := s.db.Query(query, ID)
	if err != nil {
		return nil, err
	}

	tasks := make([]types.Task, 0)
	for rows.Next() {
		p, err := scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}

		tasks = append(tasks, *p)
	}

	return tasks, nil
}
func (s *Store) GetMostPriorityTasks(ID int) ([]types.Task, error) {
	query := `SELECT t.* FROM tasks t
	JOIN do_users du ON t.task_id = du.task_id
	WHERE du.user_id = ? AND t.parent_task_id IS NULL
	ORDER BY t.priority_id ASC
	LIMIT 3`
	rows, err := s.db.Query(query, ID)
	if err != nil {
		return nil, err
	}

	tasks := make([]types.Task, 0)
	for rows.Next() {
		p, err := scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}

		tasks = append(tasks, *p)
	}

	query = `SELECT * FROM tasks t WHERE t.parent_task_id = ?`
	subtasks := make([]types.Task, 0)

	for _, t := range tasks {
		rows1, err := s.db.Query(query, t.ID)
		if err != nil {
			return nil, err
		}

		for rows1.Next() {
			p, err := scanRowsIntoTask(rows1)
			if err != nil {
				return nil, err
			}

			subtasks = append(subtasks, *p)
		}
	}
	tasks = append(tasks, subtasks...)
	return tasks, nil
}

func (s *Store) CreateTask(t types.CreateTask) error {
	query := `INSERT INTO tasks (
	task_name, 
	task_description,
 	priority_id, 
	status_id,
	start_time,
	end_time,
	attachments,
	category_id,
	parent_task_id,
	group_id)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	if t.Name == "" {
		return fmt.Errorf("You must input name")
	}

	if t.Responsible == nil {
		return fmt.Errorf("You must add responsible user for this task")
	}

	res, err := s.db.Exec(
		query,
		t.Name,
		nullIfempty(t.Description),
		nullIfZero(t.Priority_id),
		nullIfZero(t.Status_id),
		nullIfZeroTime(t.StartTime), nullIfZeroTime(t.EndTime),
		nullIfempty(t.Attachments),
		nullIfZero(t.Category_id),
		nullIfZero(t.Parent_task_id),
		nullIfZero(t.Group_id),
	)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}

	for _, m := range t.Responsible {
		_, err = s.db.Exec("INSERT INTO do_users (user_id, task_id) VALUES (?, ?)", m.ID, id)
		if err != nil {
			return err
		}
	}

	for _, sub := range t.Subtasks {
		if sub.Name == "" {
			return fmt.Errorf("You must input name")
		}
		res, err := s.db.Exec(
			query,
			sub.Name,
			nullIfempty(sub.Description),
			nullIfZero(sub.Priority_id),
			nullIfZero(sub.Status_id),
			nullIfZeroTime(t.StartTime),
			nullIfZeroTime(t.EndTime),
			nullIfempty(t.Attachments),
			nullIfZero(t.Category_id),
			nullIfZero(int(id)),
			nullIfZero(t.Group_id),
		)
		if err != nil {
			return err
		}
		sub_id, err := res.LastInsertId()
		if err != nil {
			return err
		}
		for _, m := range t.Responsible {
			_, err = s.db.Exec("INSERT INTO do_users (user_id, task_id) VALUES (?, ?)", m.ID, sub_id)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *Store) UpdateTask(t types.Task) error {
	query := `UPDATE tasks 
	SET task_name = ?, 
	task_description  = ?,
 	priority_id  = ?, 
	status_id = ?,
	start_time = ?,
	end_time = ?,
	attachments = ?,
	category_id = ?,
	parent_task_id = ?,
	group_id = ?
	WHERE task_id = ?`
	_, err := s.db.Exec(query,
		t.Name,
		nullIfempty(t.Description),
		nullIfZero(t.Priority_id),
		nullIfZero(t.Status_id),
		nullIfZeroTime(t.StartTime), nullIfZeroTime(t.EndTime),
		nullIfempty(t.Attachments),
		nullIfZero(t.Category_id),
		nullIfZero(t.Parent_task_id),
		nullIfZero(t.Group_id),
		t.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (s *Store) UpdateTaskStatus(ID, status_id int) error {
	query := `UPDATE tasks 
	SET status_id = ?
	WHERE task_id = ?`
	if status_id == 0 {
		query = `UPDATE tasks 
			SET status_id = NULL
			WHERE task_id = ?`
		_, err := s.db.Exec(query, ID)
		if err != nil {
			return err
		}
		return nil
	}
	_, err := s.db.Exec(query, status_id, ID)
	if err != nil {
		return err
	}

	return nil
}

func (s *Store) FinishTask(ID int) error {
	query := "SELECT COUNT(*) FROM tasks t WHERE t.parent_task_id = ?"
	row := s.db.QueryRow(query, ID)
	var count int

	err := row.Scan(&count)
	if err != nil {
		return err
	}

	query = `UPDATE tasks 
	SET status_id = 1
	WHERE task_id = ?`
	_, err = s.db.Exec(query, ID)
	if err != nil {
		return err
	}

	if count == 0 {
		return nil
	}

	query = `UPDATE tasks 
	SET status_id = 1
	WHERE parent_task_id = ?`
	_, err = s.db.Exec(query, ID)
	if err != nil {
		return fmt.Errorf("error updating child tasks status: %w", err)
	}

	return nil
}

func (s *Store) DeleteTask(task_id int) error {
	// Start a transaction to ensure atomicity
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1. First delete all comments associated with chats for this task
	_, err = tx.Exec(`
        DELETE FROM comments 
        WHERE chat_id IN (
            SELECT chat_id FROM chats WHERE task_id = ?
        )`, task_id)
	if err != nil {
		return err
	}

	// 2. Then delete the chats themselves
	_, err = tx.Exec("DELETE FROM chats WHERE task_id = ?", task_id)
	if err != nil {
		return err
	}

	// 3. Delete subtasks (tasks where this is the parent)
	_, err = tx.Exec("DELETE FROM tasks WHERE parent_task_id = ?", task_id)
	if err != nil {
		return err
	}

	// 4. Delete user-task associations
	_, err = tx.Exec("DELETE FROM do_users WHERE task_id = ?", task_id)
	if err != nil {
		return err
	}

	// 5. Finally delete the main task
	_, err = tx.Exec("DELETE FROM tasks WHERE task_id = ?", task_id)
	if err != nil {
		return err
	}

	// Commit the transaction if everything succeeded
	return tx.Commit()
}

func (s *Store) GetTaskByName(name string, ID int, flag bool) (*types.Task, error) {
	var query string
	if flag {
		query = "SELECT t.* FROM tasks t JOIN do_users du ON du.task_id=t.task_id WHERE du.user_id = ? AND t.task_name = ? AND t.parent_task_id IS NULL"
	} else {
		query = "SELECT t.* FROM tasks t WHERE t.group_id = ? AND t.task_name = ?"
	}
	rows, err := s.db.Query(query, ID, name)
	if err != nil {
		return nil, err
	}
	t := new(types.Task)
	for rows.Next() {
		t, err = scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}
	}
	if t.ID == 0 {
		return nil, fmt.Errorf("Task not found")
	}

	return t, nil
}

func (s *Store) GetTaskByID(ID int) (*types.Task, error) {

	query := "SELECT t.* FROM tasks t WHERE t.task_id = ?"

	rows, err := s.db.Query(query, ID)
	if err != nil {
		return nil, err
	}
	t := new(types.Task)
	for rows.Next() {
		t, err = scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}
	}
	if t.ID == 0 {
		return nil, fmt.Errorf("Task not found")
	}

	return t, nil
}

func (s *Store) GetSubTasks(ID int) ([]types.Task, error) {

	query := "SELECT t.* FROM tasks t WHERE t.parent_task_id = ?"

	rows, err := s.db.Query(query, ID)
	if err != nil {
		return nil, err
	}

	tasks := make([]types.Task, 0)
	for rows.Next() {
		p, err := scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}

		tasks = append(tasks, *p)
	}

	return tasks, nil
}

func (s *Store) GetTaskIdByName(name string, ID int, flag bool) (*int, error) {
	var query string
	if flag {
		query = "SELECT * FROM tasks t JOIN do_users du ON du.task_id=t.task_id WHERE du.user_id = ? AND t.task_name = ?"
	} else {
		query = "SELECT * FROM tasks WHERE group_id = ? AND task_name = ?"
	}
	rows, err := s.db.Query(query, ID, name)
	if err != nil {
		return nil, err
	}
	t := new(types.Task)
	for rows.Next() {
		t, err = scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}
	}
	if t.ID == 0 {
		return nil, fmt.Errorf("group not found")
	}
	if t.Parent_task_id != 0 {
		return nil, fmt.Errorf("its subtask task")
	}

	return &t.ID, nil
}

func (s *Store) AddSubtask(t types.CreateTask) error {
	query := `INSERT INTO tasks (
	task_name, 
	task_description,
 	priority_id, 
	status_id,
	start_time,
	end_time,
	attachments,
	category_id,
	parent_task_id,
	group_id)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	if t.Name == "" {
		return fmt.Errorf("You must input name")
	}

	if t.Responsible == nil {
		return fmt.Errorf("You must add responsible user for this task")
	}

	res, err := s.db.Exec(
		query,
		t.Name,
		nullIfempty(t.Description),
		nullIfZero(t.Priority_id),
		nullIfZero(t.Status_id),
		nullIfZeroTime(t.StartTime), nullIfZeroTime(t.EndTime),
		nullIfempty(t.Attachments),
		nullIfZero(t.Category_id),
		nullIfZero(t.Parent_task_id),
		nullIfZero(t.Group_id),
	)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	for _, m := range t.Responsible {
		_, err = s.db.Exec("INSERT INTO do_users (user_id, task_id) VALUES (?, ?)", m.ID, id)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) GetSubtaskByName(ParentID int, subtask_name string) (*types.Task, error) {
	var query string

	query = "SELECT t.* FROM tasks t WHERE t.task_name = ? AND t.parent_task_id = ?"

	rows, err := s.db.Query(query, subtask_name, ParentID)
	if err != nil {
		return nil, err
	}
	t := new(types.Task)
	for rows.Next() {
		t, err = scanRowsIntoTask(rows)
		if err != nil {
			return nil, err
		}
	}
	if t.ID == 0 {
		return nil, fmt.Errorf("Task not found")
	}

	return t, nil
}

func (s *Store) GetResponsible(ID int) ([]types.ResponsibleUserID, error) {
	query := `SELECT user_id FROM do_users WHERE task_id = ?`
	rows, err := s.db.Query(query, ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close() // Don't forget to close rows!

	var responsible []types.ResponsibleUserID
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		responsible = append(responsible, types.ResponsibleUserID{ID: id})
	}
	return responsible, nil
}

func scanRowsIntoTask(rows *sql.Rows) (*types.Task, error) {
	task := new(types.Task)

	// Временные переменные для полей, которые могут быть NULL
	var (
		priorityID   sql.NullInt64
		statusID     sql.NullInt64
		categoryID   sql.NullInt64
		parentTaskID sql.NullInt64
		groupID      sql.NullInt64
		description  sql.NullString
		startTime    sql.NullTime
		endTime      sql.NullTime
		attachments  sql.NullString
	)

	err := rows.Scan(
		&task.ID,
		&task.Name,
		&description,
		&priorityID,
		&statusID,
		&startTime,
		&endTime,
		&attachments,
		&categoryID,
		&parentTaskID,
		&groupID,
	)
	if err != nil {
		return nil, err
	}

	// Присвоение значений с учетом NULL
	if description.Valid {
		task.Description = description.String
	} else {
		task.Description = ""
	}

	if priorityID.Valid {
		task.Priority_id = int(priorityID.Int64)
	} else {
		task.Status_id = 0
	}

	if statusID.Valid {
		task.Status_id = int(statusID.Int64)
	} else {
		task.Status_id = 0
	}

	if startTime.Valid {
		task.StartTime = startTime.Time
	} else {
		task.StartTime = time.Time{}
	}

	if endTime.Valid {
		task.EndTime = endTime.Time
	} else {
		task.EndTime = time.Time{}
	}

	if attachments.Valid {
		task.Attachments = attachments.String
	} else {
		task.Attachments = ""
	}

	if categoryID.Valid {
		task.Category_id = int(categoryID.Int64)
	} else {
		task.Category_id = 0
	}

	if parentTaskID.Valid {
		task.Parent_task_id = int(parentTaskID.Int64)
	} else {
		task.Parent_task_id = 0
	}

	if groupID.Valid {
		task.Group_id = int(groupID.Int64)
	} else {
		task.Group_id = 0
	}

	return task, nil
}

func nullIfZero(i int) interface{} {
	if i == 0 {
		return nil
	}
	return i
}

func nullIfempty(str string) interface{} {
	if str == "" {
		return ""
	}
	return str
}

func nullIfZeroTime(t interface{}) interface{} {
	zeroTime := time.Time{}
	if t == zeroTime {
		return nil
	}
	return t
}
