# cycle-time-FE-only

Dashboard pemantauan **cycle time** untuk lini perakitan **Astra Visteon Indonesia - Final Assembly**.

Aplikasi frontend ini menampilkan status stasiun secara real time, anomali siklus, riwayat produksi, statistik stasiun, serta manajemen registrasi stasiun. Dashboard terhubung ke backend melalui REST API dan Socket.IO.

## Fitur

- Monitoring status online/offline dan heartbeat stasiun secara real time
- Ringkasan stasiun berdasarkan line produksi
- Deteksi siklus LONG, SHORT, dan proses yang melewati target yang diharapkan
- Drawer detail stasiun dengan histori, statistik per jam, dan status konektivitas
- Daftar stasiun dan halaman registrasi stasiun
- Live stream data dan informasi lapse siklus
- Ekspor data riwayat stasiun ke CSV
- Autentikasi pengguna
- Dukungan mode terang dan gelap
- Tampilan responsif untuk perangkat desktop dan mobile

## Teknologi

- React 18
- Create React App (`react-scripts` 5)
- Chakra UI
- Recharts
- Socket.IO Client
- Axios
- Framer Motion

## Persyaratan

- Node.js
- npm
- Backend CT Monitor yang dapat diakses melalui HTTP dan WebSocket

## Instalasi

```bash
git clone https://github.com/jukjuk6969/cycle-time-FE-only.git
cd cycle-time-FE-only
npm install
```

## Konfigurasi

Aplikasi dapat menggunakan backend URL melalui variabel lingkungan Create React App:

```env
REACT_APP_BACKEND_URL=http://localhost:9000
REACT_APP_PORT_FAMILY=9000
```

Jika `REACT_APP_BACKEND_URL` tidak diatur, frontend menggunakan:

```text
<protocol>://<hostname>:<REACT_APP_PORT_FAMILY>
```

Nilai default port adalah `9000`.

Variabel lingkungan wajib dimuat ulang saat menjalankan atau membangun ulang aplikasi.

## Menjalankan Aplikasi

Mode development:

```bash
npm start
```

Aplikasi tersedia secara default di `http://localhost:3000`.

Build produksi:

```bash
npm run build
```

Hasil build tersedia pada direktori `build/`.

## Integrasi Backend

Frontend menggunakan backend pada `BASE_URL` dari `src/config.js`.

Endpoint REST yang digunakan antara lain:

```text
/api/station/:line/:station_id/history
/api/station/:line/:station_id/hourly
/api/station/:line/:station_id/stats
/api/station/:line/:station_id/export
```

Socket.IO digunakan untuk menerima data real time, seperti:

- `summary_update`
- `heartbeat`
- `heartbeat_batch`
- `fd_status`
- `fd_status_all`

Koneksi hanya menggunakan transport WebSocket.

## Struktur Direktori

```text
src/
├── App.jsx                # Shell dashboard dan navigasi halaman
├── config.js              # Konfigurasi backend URL
├── components/            # Komponen UI dan panel dashboard
├── hooks/                 # Authentication, Socket.IO, dan tema
├── assets/                # Logo dan aset gambar
├── theme.js               # Konfigurasi tema Chakra
└── theme-vars.css         # Variabel tema dan warna

public/                    # File publik dan index.html
build/                     # Output build produksi
```

## Skrip npm

| Perintah | Deskripsi |
| --- | --- |
| `npm start` | Menjalankan aplikasi dalam mode development |
| `npm run build` | Membuat build produksi |

## Lisensi

Belum ada lisensi yang ditetapkan pada repository ini.
