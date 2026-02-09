package models

import (
	"time"

	"github.com/google/uuid"
)

type Workspace struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name      string    `gorm:"not null"`
	OwnerID   uuid.UUID `gorm:"not null"`
	Owner     User
	Members   []Membership `gorm:"foreignKey:WorkspaceID"`
	Projects  []Project    `gorm:"foreignKey:WorkspaceID"`
	CreatedAt time.Time
}
