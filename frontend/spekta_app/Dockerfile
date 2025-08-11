# --- Tahap 1: Build aolikasi React ---
FROM node:18 AS build

WORKDIR /app

# Salin package.json dan instal dependensi
COPY package*.json ./
RUN npm install

# Salin seluruh kode dan build aplikasi
COPY . .
RUN npm run build

# --- Tahap 2: Sajikan file statis dengan Nginx ---
FROM nginx:stable-alpine

# Salin hasil build dari tahap sebelumnya ke direktori web Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Salin file konfigurasi Nginx (akan kita buat selanjutnya)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ekspos port 80
EXPOSE 80

# Perintah untuk menjalankan Nginx
CMD ["nginx", "-g", "daemon off;"]