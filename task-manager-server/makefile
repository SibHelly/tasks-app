build:
	go build -o bin/api cmd/main.go

test:
	go test -v ./...

run: build
	./bin/api

migration:
	migrate create -ext sql -dir cmd/migrate/migrations -seq $(name)

migrate-up:
	go run cmd/migrate/main.go up

migrate-down:
	go run cmd/migrate/main.go down