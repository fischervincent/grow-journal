This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## TODO
- when create a plant -> create reminders
- the user can customize settings about notif -> no notif, what time, email?, push notif?
- reminder -> cron scheduler and notif -> email
- notif -> pushNotif
- possibility to see reminders / reminder
- notif -> land on reminder
- can snooze a reminder and set the date or the reminder
- when we submit event, we recalculate reminder or create one
- when user is created, wizard to choose (and create ?) event types, with default events like water and fertilizer and repot and health check?
- filter plant list by location
- event types form - add a way to create event types that are suggested, like a dropdown or a list where you can select from
- form error handling
- refactor: /actions <- bad name, it's not only server actions
- feedback on user actions like: creating / deleting an event type
- search notes in backend (if notes > 50 ?) with debounce 
