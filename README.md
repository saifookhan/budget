# My Budget

A personal budget app to track monthly income, spending by category, multiple accounts (e.g. Revolut, bank), subscriptions, and savings.

## Features

- **Overview** – Monthly income, money left, spending by category, breakdown by account
- **Income** – Set your monthly take-home income
- **Accounts** – Add accounts (Revolut for groceries, bank for rent, etc.) and assign transactions to them
- **Categories** – Create spending categories (groceries, rent, fun, etc.)
- **Spending** – Log one-off expenses with category and account
- **Subscriptions** – Add monthly subscriptions (Netflix, gym…). They are added automatically each month on the day you choose (1–28) so you always see how much you spend per category
- **Savings** – Set a monthly amount (e.g. €100). It’s added automatically at the start of each month and you see how much you’ve saved since you started

Data is stored in your browser (localStorage). No server or account required.

## Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve that folder with any static host.
