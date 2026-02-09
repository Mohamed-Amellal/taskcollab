package models

import (
	"time"

	"github.com/google/uuid"
)

type Membership struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID      uuid.UUID `gorm:"not null"`
	WorkspaceID uuid.UUID `gorm:"not null"`
	Role        string    `gorm:"not null"`

	User      User
	Workspace Workspace
	CreatedAt time.Time
}
