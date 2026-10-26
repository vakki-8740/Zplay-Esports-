# ZPLAY Esports registration flow

A React + Vite prototype for the tournament joining journey. The interface follows the OWN LABRARY component patterns for form fields, upload states, and confirmation feedback.

## Pages

- `/join` — register or log in, then fill player details. The saved account is remembered in this browser.
- `/payment` — enter a UTR and upload a payment screenshot.
- `/tournaments` — registration status page opened by the confirmation modal's **View registration status** button.

## Run locally

```sh
npm install
npm run dev
```

Production build: `npm run build`.

## Before launch

This is a front-end prototype and currently stores account/profile/submission data in browser `localStorage`; it does not create server-side accounts or send payment submissions to an admin. Replace the marked payment QR and organizer account-holder placeholder with the actual payment details, and connect the registration and receipt upload to a secure backend before accepting real payments. Do not use this local-only account flow as production authentication.
