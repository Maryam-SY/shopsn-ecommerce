# ============================================
# STAGE 1 : BUILD ANGULAR
# ============================================

FROM node:22-alpine3.24 AS build

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Copier le projet
COPY . .

# Compiler Angular en production
RUN npm run build -- --configuration production


# ============================================
# STAGE 2 : NGINX
# ============================================

FROM nginx:alpine3.24

# Mettre à jour les paquets Alpine
# pour récupérer les correctifs de sécurité
RUN apk update && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Supprimer la page nginx par défaut
RUN rm -rf /usr/share/nginx/html/*

# Copier le build Angular
COPY --from=build /app/dist/ecommerce-app/browser/ /usr/share/nginx/html/

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port HTTP
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]