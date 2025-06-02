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
- Fix plant list page, there are two buttons and the list does not update when new plant
- register plant event (add PlantEvents table (with plantEventType, comment, plantEventDateTime, plantId, userId, and index on userId and also userId+plantId, and userId+plantId+plantEventType, and userId+plantId+plantEventDateTime), quick action event on PlantList and Plant views, and not quick action on the Plant Detail page)
- can sort by events in PlantList event and display quickAction event last date
- in PlantDetails can see every events and we can filter them by plantEventType, or search by text from comment
- can add/remove pictures of plant, with main picture (displayed for the plant in the PlantList and PlantDetails view)
- when user is created, wizard to choose (and create ?) event types
- event types form - add a way to create event types that are suggested, like a dropdown or a list where you can select from
- form error handling
- refactor: /actions <- bad name, it's not only server actions
- feedback on user actions like: creating / deleting an event type