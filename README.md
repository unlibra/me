# unlibra.com

A portfolio website with X (Twitter) profile page-inspired design.

## Features

- **X-style Design**: Design inspired by X's profile page
- **SSG**: Fast loading with Astro static site generation
- **Category Filtering**: Filter works by tabs and hashtags
- **Image Optimization**: Automatic hashing and optimization with Astro Image
- **Self-hosted Fonts**: Font self-hosting with @fontsource

## Tech Stack

- [Astro](https://astro.build/) - Static Site Generator
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling
- [IBM Plex Sans JP](https://fonts.google.com/specimen/IBM+Plex+Sans+JP) - Font (@fontsource)
- TypeScript - Type safety

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Deployment

Configured for Cloudflare Pages.

### Build Configuration

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18 or higher

### Caching

Immutable cache (1 year) is configured for `/_astro/*`.

## Customization

Edit `src/pages/index.astro`:

- `site` - Site name, URL, OGP settings
- `profile` - Name, bio, links
- `categories` - Work categories
- `allWorks` - Work data

### Adding Images

1. Place images in `src/assets/works/`
2. Import in `index.astro`
3. Set to `image` property in `allWorks`

## License

MIT
