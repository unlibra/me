# Portfolio

A modern portfolio website built with Astro and Tailwind CSS.

## Features

- **Fast & Modern**: Built with Astro for optimal performance and SSG
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Sections**:
  - Hero section with introduction
  - Works showcase (Websites, Apps, Custom Keyboards)
  - Contact information

## Tech Stack

- [Astro](https://astro.build/) - Static Site Generator
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- TypeScript - Type safety

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This site is configured for deployment on Cloudflare Pages.

### Build Configuration

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18 or higher

## Customization

Edit the project data in `src/pages/index.astro`:

- Update personal information in the Hero section
- Add your projects to the `websites`, `keyboards` arrays
- Update contact links (GitHub, Twitter, Email)
- Replace placeholder images with your own

## License

MIT
