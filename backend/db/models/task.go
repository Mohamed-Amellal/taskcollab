package models

import (
	"time"

	"github.com/google/uuid"
)

type Task struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title       string    `gorm:"not null"`
	Description string
	Status      string `gorm:"not null;default:TODO"`
	Priority    string `gorm:"not null;default:MEDIUM"`

	ProjectID uuid.UUID `gorm:"not null"`
	Project   Project

	AssignedTo *uuid.UUID
	Assignee   *User `gorm:"foreignKey:AssignedTo"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
