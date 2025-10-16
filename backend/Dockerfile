# Etapa 1: Usar una imagen oficial de Node.js
FROM node:20

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias del backend
RUN npm install

# Copiar el resto del código fuente del backend
COPY . .

# Exponer el puerto que usa el backend
EXPOSE 5000

# Comando para correr la aplicación
CMD [ "npm", "start" ]