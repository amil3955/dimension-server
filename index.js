import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import routes from './routes/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Connect to MongoDB
await connectDB()

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API Routes
app.use('/api', routes)

// Serve static files from client build
const clientDistPath = path.join(__dirname, 'dist')
app.use(express.static(clientDistPath))

// Serve index.html for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' })
  }
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📦 Serving client from: ${clientDistPath}`)
})
