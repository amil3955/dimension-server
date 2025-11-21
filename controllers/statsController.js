import { User, Object3D, Purchase } from '../models/index.js'

/**
 * Get platform statistics
 */
export async function getStats(req, res) {
  try {
    const totalObjects = await Object3D.countDocuments()
    const totalUsers = await User.countDocuments()
    const totalSales = await Purchase.countDocuments()
    
    const purchases = await Purchase.find()
    const totalVolume = purchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0)

    res.json({
      totalObjects,
      totalUsers,
      totalSales,
      totalVolume
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
}

