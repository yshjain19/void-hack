import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist! Run vite build first.')
  process.exit(1)
}

const indexHtmlPath = path.join(distDir, 'index.html')
if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found!')
  process.exit(1)
}

const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8')

// Pre-create directories and index.html for known routes to ensure direct HTTP 200 on static hosts
const staticRoutes = [
  'dashboard',
  'cases',
  'cases/new',
  'graph',
  'analytics',
  'ai',
  'reports',
  'evidence',
  'evidence/upload',
]

for (const route of staticRoutes) {
  const targetDir = path.join(distDir, route)
  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtmlContent, 'utf8')
  console.log(`[postbuild] Generated route static entry: ${route}/index.html`)
}

console.log('[postbuild] Static route pre-generation complete!')
