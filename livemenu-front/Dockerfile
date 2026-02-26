# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps && npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
