# Stockku Stock Price Analysis

Aplikasi web berbasis Next.js untuk analisis saham (fokus pasar Indonesia) yang memanfaatkan DataSaham API. Project ini menyediakan landing page dan berbagai halaman analitik seperti dashboard market movers, analisis teknikal, sentimen pasar, hingga data broker dan transaksi besar.

## Fitur Utama
- Dashboard market movers: top gainers, top losers, most active, net foreign buy.
- Halaman analisis per saham dengan data historis, technical analysis, orderbook, dan insights.
- Ringkasan broker dan kalender broker.
- Market sentiment, retail opportunity, whale transactions, IPO momentum, correlation matrix, dan trending.
- Landing page modern untuk presentasi produk.

## Tech Stack
- Next.js 15 + React 19
- Tailwind CSS v4 + Radix UI
- Recharts + Framer Motion
- Zod + React Hook Form

## Prasyarat
- Node.js dan salah satu package manager: `npm`, `pnpm`, atau `bun`.

## Instalasi
1. Install dependencies:

```bash
npm install
# atau
pnpm install
# atau
bun install
```

2. Buat file `.env.local` di root project:

```bash
DATASAHAM_API_KEY=your_api_key_here
```

3. Jalankan development server:

```bash
npm run dev
# atau
pnpm dev
# atau
bun dev
```

4. Buka `http://localhost:3000` di browser.

## Scripts
- `npm run dev` menjalankan server development.
- `npm run build` build produksi.
- `npm run start` menjalankan hasil build.
- `npm run lint` menjalankan linting.

## Rute Utama
- `/` landing page.
- `/dashboard` ringkasan market movers.
- `/stock/[symbol]` analisis detail per saham.
- `/market-sentiment` sentimen pasar.
- `/predictions` prediksi pergerakan.
- `/broker-summary` ringkasan broker.
- `/broker-calendar` kalender broker.
- `/correlation-matrix` korelasi saham.
- `/retail-opportunity` peluang retail.
- `/whale-transactions` transaksi besar.
- `/ipo-momentum` momentum IPO.
- `/trending` saham trending.

## Catatan
- Project menggunakan DataSaham API. Pastikan `DATASAHAM_API_KEY` valid agar data bisa diambil.

