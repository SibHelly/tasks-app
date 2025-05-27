package types

type ChatStore interface {
	CreateChat(chat CreateChat) (*Chat, error)
	GetChats(taskID int) ([]Chat, error)
	GetChat(taskID int) (*Chat, error)
	GetChatsGroup(groupID int) ([]Chat, error)
	GetChatByName(taskID int, chatName string) (*Chat, error)
	UpdateChat(chatID int, newName string) error
	DeleteChat(chatID int) error
}

type CommentStore interface {
	SendCommnet(comment CreateComment) error
	DeleteCommnet(commentID int) error
	GetComments(chatID int) ([]Comment, error)
}

type Chat struct {
	ID     int    `json:"chat_id"`
	TaskID int    `json:"task_id"`
	Name   string `json:"chat_name"`
}

type CreateChat struct {
	TaskID int    `json:"task_id"`
	Name   string `json:"chat_name"`
}

type Comment struct {
	ID          int    `json:"comment_id"`
	ChatID      int    `json:"chat_id"`
	SenderID    int    `json:"sender_id"`
	CommentText string `json:"comment"`
}

type CreateComment struct {
	ChatID      int    `json:"chat_id"`
	SenderID    int    `json:"sender_id"`
	CommentText string `json:"comment"`
}
