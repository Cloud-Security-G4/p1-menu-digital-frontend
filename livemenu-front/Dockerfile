FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build


FROM nginx:1.27-alpine

# parchea vulnerabilidades conocidas
RUN apk update && apk upgrade --no-cache

# elimina config default
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

CMD ["nginx", "-g", "daemon off;"]