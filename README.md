# JSA Browser Extension

🎯 See how well each job fits you before you even open it!

Browser extension that shows visual match indicators on job listings based on your resume.

## Features

- 🔐 Secure authentication (Google/Microsoft OAuth)
- 📄 Upload and manage resumes
- ✨ Visual match badges on job listings:
  - **Gold**: Excellent match (≥75%)
  - **Green**: Good match (≥65%)
  - **Blue**: Worth checking out (≥50%)
- 🌐 Supported platforms (Netherlands):
  - LinkedIn
  - Glassdoor
  - NationaleVacaturebank
  - WerkZoeken

## Development

### Prerequisites

Install [Bun](https://bun.sh):
```bash
curl -fsSL https://bun.sh/install | bash
```

### Build

```bash
# Install dependencies
bun install

# Build for Chrome
bun run build:chrome

# Build for Firefox
bun run build:firefox
```

### Load Extension

**Chrome:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `dist-chrome/`

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select `dist-firefox/manifest.json`

### Run

```bash
# Development mode with hot reload
bun run dev:chrome
bun run dev:firefox

# Run tests
bun run test
bun run test:watch
```

### Local API Testing

To test against a local backend:

```bash
# Set local API URL
echo "VITE_API_BASE_URL=http://localhost:8080" > .env

# Build with local API
bun run dev:chrome
```

Make sure your local backend has the extension callback URL configured for OAuth.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
