# StockWise Inventory Management System

StockWise is a complete browser-based inventory system made with HTML, CSS, JavaScript, LocalStorage, Chart.js, and Lucide Icons. It has no backend or database server.

## How to run

1. Open the `inventory-system` folder in Visual Studio Code.
2. Install the **Live Server** extension if needed.
3. Right-click `login.html` and choose **Open with Live Server**.
4. Log in using:
   - Username: `admin`
   - Password: `admin123`

An internet connection is needed the first time Chart.js and Lucide Icons load from their CDNs.

## Included functions

- Protected admin login and sign out
- Responsive sidebar and light/dark themes
- Dashboard summaries and charts
- Product CRUD, filtering, sorting, image upload, and automatic stock status
- Stock-in and stock-out validation
- Categories and suppliers CRUD
- Permanent transaction history with filters
- Nine report types, printing, and CSV export
- JSON backup/import and full reset
- Settings for business information, account, profile, currency, and theme
- Sample data that is added once only

## Important security note

This project is intended for a school demonstration. LocalStorage is readable and editable by the browser user, so the login and stored information are **not secure enough for a real business**. A production system should use a secure backend, hashed passwords, authorization, a database, and server-side validation.

## Image limits

Product and profile images must be JPG, PNG, or WebP and no larger than 500 KB. Images are stored as Base64 text, so using many images may fill the browser's LocalStorage.

## Resetting

Use **Settings → Reset System**. This permanently deletes local data. Export a JSON backup first if you may need the records later.
