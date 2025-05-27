package chat

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

func (s *Store) CreateChat(chat types.CreateChat) (*types.Chat, error) {
	query := `INSERT INTO chats (task_id, chat_name) VALUES (? , ?)`
	res, err := s.db.Exec(query, chat.TaskID, chat.Name)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	ch := types.Chat{ID: int(id), TaskID: chat.TaskID, Name: chat.Name}
	return &ch, nil
}

func (s *Store) GetChats(taskID int) ([]types.Chat, error) {
	query := `SELECT * FROM chats WHERE task_id = ?`
	rows, err := s.db.Query(query, taskID)
	if err != nil {
		return nil, err
	}
	chats := make([]types.Chat, 0)
	for rows.Next() {
		c, err := scanRowsIntoChat(rows)
		if err != nil {
			return nil, err
		}
		chats = append(chats, *c)
	}

	return chats, nil
}

func (s *Store) GetChat(chatID int) (*types.Chat, error) {
	query := `SELECT * FROM chats WHERE chat_id = ?`
	row := s.db.QueryRow(query, chatID)
	ch := new(types.Chat)
	err := row.Scan(&ch.ID, &ch.TaskID, &ch.Name)
	if err != nil {
		return nil, err
	}

	return ch, nil
}

func (s *Store) GetChatsGroup(groupID int) ([]types.Chat, error) {
	query := `SELECT ch.* FROM chats ch JOIN tasks t ON ch.task_id = t.task_id WHERE t.group_id = ?`
	rows, err := s.db.Query(query, groupID)
	if err != nil {
		return nil, err
	}
	chats := make([]types.Chat, 0)
	for rows.Next() {
		c, err := scanRowsIntoChat(rows)
		if err != nil {
			return nil, err
		}
		chats = append(chats, *c)
	}

	return chats, nil
}

func (s *Store) GetChatByName(taskID int, chatName string) (*types.Chat, error) {
	rows, err := s.db.Query("SELECT * FROM chats WHERE task_id = ? AND chat_name = ?", taskID, chatName)
	if err != nil {
		return nil, err
	}

	ch := new(types.Chat)
	for rows.Next() {
		ch, err = scanRowsIntoChat(rows)
		if err != nil {
			return nil, err
		}
	}
	if ch.ID == 0 {
		return nil, fmt.Errorf("chat not found")
	}
	return ch, nil
}

func (s *Store) UpdateChat(chatID int, newName string) error {
	_, err := s.db.Exec("UPDATE chats SET chat_name = ? WHERE chat_id = ?", newName, chatID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) DeleteChat(chatID int) error {
	_, err := s.db.Exec("DELETE FROM comments WHERE chat_id = ?", chatID)
	if err != nil {
		return err
	}
	_, err = s.db.Exec("DELETE FROM chats WHERE chat_id = ?", chatID)
	if err != nil {
		return err
	}

	return nil
}

func scanRowsIntoChat(rows *sql.Rows) (*types.Chat, error) {
	chat := new(types.Chat)

	err := rows.Scan(&chat.ID, &chat.TaskID, &chat.Name)

	if err != nil {
		return nil, err
	}

	return chat, nil
}
