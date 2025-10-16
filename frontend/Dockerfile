# Etapa 1: Construcción
FROM node:20 as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Servir la aplicación con un servidor ligero
FROM nginx:stable-alpine

# Copiar los archivos construidos de la etapa anterior al directorio de Nginx
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copiar una configuración personalizada de Nginx (la crearemos a continuación)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]