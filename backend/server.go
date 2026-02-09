package main

import (
	"log"
	"os"
	"task-api/db"
	"task-api/graph"
	middleware "task-api/middlware"
	"task-api/newhttp"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	db.Connect()
	db.Migrate()

	server := gin.Default()
	server.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))
	server.Use(middleware.AuthMiddleware())

	resolver := &graph.Resolver{DB: db.DB, JWTSecret: os.Getenv("JWT_SECRET")}

	server.GET("/", newhttp.PlaygroundHandler())
	server.POST("/query", newhttp.GraphQLHandler(resolver))

	log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
	if err := server.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
