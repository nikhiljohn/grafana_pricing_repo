.PHONY: help up down logs seed reset test test-backend test-frontend lint shell-backend shell-neo4j shell-postgres build clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 15
	@echo ""
	@echo "──────────────────────────────────────────────────────"
	@echo "  Intellicore CMP is up:"
	@echo "  UI:            http://localhost:3000"
	@echo "  API docs:      http://localhost:8000/docs"
	@echo "  Neo4j:         http://localhost:7474  (neo4j / see .env)"
	@echo "──────────────────────────────────────────────────────"
	@echo "  Run 'make seed' to load the demo Memory graph."

down: ## Stop all services
	docker compose down

logs: ## Tail logs from all services
	docker compose logs -f --tail=100

seed: ## Load the demo graph + demo tenant into Neo4j and Postgres
	docker compose exec backend python -m scripts.seed_demo

reset: ## Wipe all databases and re-seed with fresh demo data
	docker compose down -v
	docker compose up -d
	@sleep 20
	docker compose exec backend python -m scripts.seed_demo

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend pytest suite
	docker compose exec backend pytest -v

test-frontend: ## Run frontend tests
	docker compose exec frontend npm test

lint: ## Format and lint all code
	docker compose exec backend ruff format app tests scripts
	docker compose exec backend ruff check app tests scripts --fix
	docker compose exec frontend npm run lint

shell-backend: ## Open a shell in the backend container
	docker compose exec backend bash

shell-neo4j: ## Open a Cypher shell in Neo4j
	docker compose exec neo4j cypher-shell -u neo4j -p $$(grep NEO4J_PASSWORD .env | cut -d= -f2)

shell-postgres: ## Open a psql shell
	docker compose exec postgres psql -U intellicore -d intellicore

build: ## Rebuild service images
	docker compose build --no-cache

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi local
