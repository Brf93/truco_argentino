# Etapa 1: Construcción (compilar CSS)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:css

# Etapa 2: Servidor Web (Nginx)
FROM nginx:stable-alpine
# Copiamos los archivos estáticos desde la etapa de build
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY --from=build /app/assets /usr/share/nginx/html/assets
COPY --from=build /app/scripts /usr/share/nginx/html/scripts
COPY --from=build /app/styles /usr/share/nginx/html/styles

# Copiamos la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
