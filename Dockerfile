FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-fund --no-audit

# VITE_* values are baked into the bundle at build time.
ARG VITE_GATEWAY_URL
ARG VITE_IDENTITY_API_URL
ARG VITE_CATALOG_API_URL
ARG VITE_INVENTORY_API_URL
ARG VITE_WAITING_ROOM_API_URL
ARG VITE_BOOKING_API_URL
ARG VITE_PAYMENT_API_URL
ARG VITE_NOTIFICATION_API_URL
ARG VITE_ASGARDEO_CLIENT_ID

COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
