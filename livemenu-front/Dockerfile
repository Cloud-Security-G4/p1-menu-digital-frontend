FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build


FROM nginx:1.27-alpine

# parchea vulnerabilidades conocidas
RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache gettext

# elimina config default
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]