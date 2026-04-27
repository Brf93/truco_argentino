FROM node:20-alpine

WORKDIR /app

# Instalamos json-server de forma global
RUN npm install -g json-server

# Copiamos el archivo de la base de datos
COPY db.json .

# Exponemos el puerto 3000
EXPOSE 3000

# Ejecutamos json-server
# Usamos --host 0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["json-server", "--watch", "db.json", "--port", "3000", "--host", "0.0.0.0"]
