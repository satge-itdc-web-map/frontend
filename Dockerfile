# ============================================================
# Étape 1 : build React (CRA)
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
# Cache npm entre les builds (BuildKit) + options qui accélèrent l'installation
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline

COPY . .

# En production l'API est appelée en chemin relatif : /api -> proxy nginx -> backend:4000
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    GENERATE_SOURCEMAP=false \
    DISABLE_ESLINT_PLUGIN=true \
    NODE_OPTIONS=--max-old-space-size=1536 \
    CI=false

RUN npm run build

# ============================================================
# Étape 2 : nginx qui sert le build + proxy /api
# ============================================================
FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]