# FinTrack User Transaction Dashboard

This project is a Next.js dashboard for managing and viewing user transactions. It features:

- Paginated and searchable transaction table
- Export and stream export to CSV
- Filtering and sorting
- Responsive design for desktop and mobile
- Modern UI components

## Getting Started

1. Install dependencies:
   ```sh
   pnpm install
   ```
2. Run the development server:
   ```sh
   pnpm dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Folder Structure
- `app/` - Main Next.js app pages and layout
- `components/ui/` - Reusable UI components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions
- `public/` - Static assets
- `styles/` - Global styles

## API
The dashboard expects a transactions API running at `http://localhost:4500`. The API source code is located in the `transaction` folder of the repository:

```
git@github.com:harcop/stream-file.git
```
See the code for details on endpoints used.

## License
MIT
