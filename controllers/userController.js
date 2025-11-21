import { User, Object3D } from '../models/index.js'

/**
 * Get user profile by address
 */
export async function getUser(req, res) {
  try {
    const address = req.params.address.toLowerCase()
    const user = await User.findOne({ 'wallets.address': address })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const objects = await Object3D.find({ creatorAddress: address })
    
    res.json({ 
      id: user._id,
      fullname: user.fullname,
      wallets: user.wallets,
      objects 
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
}

/**
 * Update user profile
 */
export async function updateUser(req, res) {
  try {
    const address = req.params.address.toLowerCase()
    const { fullname } = req.body
    const user = await User.findOne({ 'wallets.address': address })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (fullname) user.fullname = fullname
    
    await user.save()
    
    res.json({
      id: user._id,
      fullname: user.fullname,
      wallets: user.wallets
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
}

