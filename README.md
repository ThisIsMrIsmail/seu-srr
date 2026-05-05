# Student Search Interface

Student Search Interface is a Next.js app for uploading an Excel workbook, searching student records, managing selections, and exporting the updated result set.

## Stack

- Next.js App Router
- React 18
- Tailwind CSS
- Web Worker based Excel parsing with `xlsx`

## Development

1. Install dependencies:

	```bash
	npm install
	```

2. Start the development server:

	```bash
	npm run dev
	```

3. Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Deploy To Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import the project in Vercel.
3. Keep the default framework preset as `Next.js`.
4. Use the default build command `npm run build` and output settings detected by Vercel.
5. Deploy.

No custom Vercel configuration is required for this app.