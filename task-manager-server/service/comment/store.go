package comments

import (
	"database/sql"

	"github.com/SibHelly/task-manager-server/types"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) SendCommnet(comment types.CreateComment) error {
	query := `INSERT INTO comments (chat_id, sender_id, comment_text) VALUES (? , ?, ?)`
	_, err := s.db.Exec(query, comment.ChatID, comment.SenderID, comment.CommentText)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) DeleteCommnet(commentID int) error {
	_, err := s.db.Exec("DELETE FROM comments WHERE comment_id = ?", commentID)
	if err != nil {
		return err
	}
	return nil
}

func (s *Store) GetComments(chatID int) ([]types.Comment, error) {
	query := `SELECT * FROM comments WHERE chat_id = ?`
	rows, err := s.db.Query(query, chatID)
	if err != nil {
		return nil, err
	}
	comments := make([]types.Comment, 0)
	for rows.Next() {
		c, err := scanRowsIntoComment(rows)
		if err != nil {
			return nil, err
		}
		comments = append(comments, *c)
	}

	return comments, nil
}

func scanRowsIntoComment(rows *sql.Rows) (*types.Comment, error) {
	comment := new(types.Comment)

	err := rows.Scan(&comment.ID, &comment.ChatID, &comment.SenderID, &comment.CommentText)

	if err != nil {
		return nil, err
	}

	return comment, nil
}
