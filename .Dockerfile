
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Production environment
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Expose cổng 80
EXPOSE 80
# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
