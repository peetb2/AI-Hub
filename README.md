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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Supabase Setup

This app uses Supabase Auth plus two database tables:

- `public.profiles` for user email and role
- `public.user_keys` for per-user saved keys

After creating your Supabase project, open the Supabase SQL editor and run `supabase/schema.sql` from this repository. If you skip that step, the app will show a missing-table error when it tries to load or save keys.

## Docker Desktop Local AI

The chat UI now talks to a local OpenAI-compatible endpoint through `app/api/chat/route.ts`.

1. For Ollama, make sure it is running on `http://localhost:11434` and exposes the OpenAI-compatible API at `http://localhost:11434/v1`.
2. Set `LOCAL_AI_BASE_URL=http://localhost:11434/v1` in `.env.local`.
3. In Key Center, activate a model name that exactly matches the Ollama model ID, for example `llama3.2` or `qwen2.5-coder`.
4. Open the Code Assistant page and chat; the browser calls `/api/chat`, and the server forwards the request to Docker locally.

If the model name in Key Center does not match an Ollama model ID, the request will fail even though the web app is connected correctly.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
