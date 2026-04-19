# Tahap 1: Build Image
FROM node:20-alpine AS builder

# Atur direktori kerja di dalam container
WORKDIR /app

# Salin file konfigurasi npm (package.json & package-lock.json jika ada)
COPY package*.json ./

# Install SEMUA dependencies (termasuk devDependencies karena server.ts meng-import vite)
RUN npm install

# Salin seluruh kode aplikasi
COPY . .

# Build frontend React/Vite (hasilnya akan masuk ke folder dist/)
RUN npm run build

# Tahap 2: Production Image (Lebih Ringan)
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables untuk produksi
ENV NODE_ENV=production
ENV PORT=3000

# Salin file yang dibutuhkan dari tahap builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

# Buka akses di port 3000
EXPOSE 3000

# Eksekusi server menggunakan tsx (untuk mengeksekusi langsung server.ts)
CMD ["npx", "tsx", "server.ts"]
