package models

import (
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name        string    `gorm:"not null"`
	WorkspaceID uuid.UUID `gorm:"not null"`
	Workspace   Workspace
	CreatedAt   time.Time
}
