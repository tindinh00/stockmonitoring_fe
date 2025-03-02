# Build environment
FROM node:22-alpine as build
WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng cache Docker
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Build project (Vite output sẽ nằm trong thư mục `dist/`)
RUN npm run build

# Production environment
FROM nginx:stable-alpine

# Copy file build từ bước trước vào thư mục Nginx phục vụ web
COPY --from=build /app/dist /usr/share/nginx/html

# Expose cổng 80
EXPOSE 80

# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
