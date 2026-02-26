package middleware

import (
	"os"
	"strings"
	"task-api/db"
	"task-api/db/models"
	"task-api/internal/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.Next()
			return
		}

		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			// If configuration is missing, we probably should fail or just log
			c.Next()
			return
		}

		claims, err := auth.ParseToken(token, secret)
		if err != nil {
			c.Next()
			return
		}

		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			c.Next()
			return
		}

		var user models.User
		if err := db.DB.First(&user, "id = ?", userID).Error; err != nil {
			c.Next()
			return
		}

		ctx := auth.WithUser(c.Request.Context(), &user)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
