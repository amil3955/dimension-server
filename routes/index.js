import { Router } from 'express'
import authRoutes from './auth.js'
import userRoutes from './users.js'
import objectRoutes from './objects.js'
import purchaseRoutes from './purchases.js'
import statsRoutes from './stats.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/objects', objectRoutes)
router.use('/purchases', purchaseRoutes)
router.use('/stats', statsRoutes)

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

export default router

