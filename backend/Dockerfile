# Gunakan base image Python resmi
FROM python:3.10-alpine

# Atur agar output Python tidak di-buffer
ENV PYTHONUNBUFFERED 1

# Atur direktori kerja di dalam kontainer
WORKDIR /app

# Salin file requirements
COPY requirements.txt .

# Instal dependensi
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode proyek ke dalam kontainer
COPY . .

# Jalankan collectstatic
RUN python manage.py collectstatic --noinput

# Port yang akan diekspos oleh kontainer
EXPOSE 8000

# Perintah untuk menjalankan aplikasi saat kontainer dimulai
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]