package db

import "task-api/db/models"

func Migrate() {
	DB.Exec("CREATE EXTENSION IF NOT EXISTS pgcrypto")
	DB.AutoMigrate(
		&models.User{},
		&models.Workspace{},
		&models.Membership{},
		&models.Project{},
		&models.Task{})
}
