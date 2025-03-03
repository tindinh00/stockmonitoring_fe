# Build application
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production environment
FROM nginx:stable-alpine

# Copy file build vào thư mục Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy cấu hình Nginx để xử lý SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose cổng 80
EXPOSE 80

# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
