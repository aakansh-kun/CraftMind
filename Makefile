.PHONY: up down build test test-backend logs clean

up:
	docker compose up --build -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test-backend:
	cd backend && pytest -v

test: test-backend
