FROM golang:1.25.6-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
RUN go build -o /app/server ./server.go

FROM alpine:3.19

WORKDIR /app
COPY --from=build /app/server /app/server

EXPOSE 8080

CMD ["/app/server"]
