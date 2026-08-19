# ============================================================
# ÉTAPE 1 : Build Angular
# ============================================================
FROM node:22-alpine3.24 AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le projet
COPY . .

# Build Angular en production
RUN npm run build -- --configuration production


# ============================================================
# ÉTAPE 2 : Serveur Nginx
# ============================================================
FROM nginx:alpine3.22

# Supprimer la configuration et les fichiers par défaut
RUN rm -rf /usr/share/nginx/html/*

# Copier le build Angular
COPY --from=build /app/dist/ecommerce-app/browser/ /usr/share/nginx/html/

# Configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port HTTP
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]