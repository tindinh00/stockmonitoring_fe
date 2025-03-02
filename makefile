# Docker registry và thông tin image
IMAGE_REG ?= docker.io
IMAGE_REPO ?= duonggiotai/stockmonitoring-fe
IMAGE_TAG ?= latest

# Không thay đổi
SRC_DIR := src

.PHONY: help install test lint build image push deploy clean run login
.DEFAULT_GOAL := help

help:  ## 💬 Hiển thị danh sách lệnh
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Cài đặt dependencies
install:  ## 📦 Cài đặt dependencies
	npm install

test: install  ## 🎯 Chạy Unit Tests
	@echo "Running Unit Tests..."
	npm run test -- --watchAll=false || echo "Tests failed but continuing..."

# Chạy Lint
lint: install  ## 🔎 Kiểm tra lỗi code bằng ESLint
	@echo "Running Lint Tests..."
	npm run lint || echo "Linting failed but continuing..."

# Build ứng dụng
build: install  ## 🔨 Build ứng dụng React/Vite
	@echo "Building the application..."
	CI=false npm run build

# Đăng nhập Docker Hub
login:  ## 🔑 Đăng nhập Docker Hub
	@echo "Logging into Docker Hub..."
	docker login $(IMAGE_REG)

# Tạo image Docker
image: build  ## 🐳 Build Docker image
	@echo "Building Docker image..."
	docker build -t $(IMAGE_REG)/$(IMAGE_REPO):$(IMAGE_TAG) .

# Push image lên Docker Hub
push: login image  ## 📤 Push Docker image lên registry
	@echo "Pushing Docker image..."
	docker push $(IMAGE_REG)/$(IMAGE_REPO):$(IMAGE_TAG)

# Chạy container để test ứng dụng
run:  ## 🚀 Chạy container Docker
	@echo "Running container..."
	docker run --rm -p 8080:80 $(IMAGE_REG)/$(IMAGE_REPO):$(IMAGE_TAG)

# Dọn dẹp file tạm
clean:  ## 🧹 Dọn dẹp file rác
	@echo "Cleaning temporary files..."
	@rm -rf node_modules dist
	@echo "Cleanup completed."
