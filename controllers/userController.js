import { User, Object3D } from '../models/index.js'

/**
 * Get user profile by address
 */
export async function getUser(req, res) {
  try {
    const user = await User.findOne({ address: req.params.address.toLowerCase() })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const objects = await Object3D.find({ creatorAddress: req.params.address.toLowerCase() })
    
    res.json({ 
      id: user._id,
      address: user.address,
      username: user.username,
      walletType: user.walletType,
      ethBalance: user.ethBalance,
      totalBalanceUsd: user.totalBalanceUsd,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
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
    const { username, bio } = req.body
    const user = await User.findOne({ address: req.params.address.toLowerCase() })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (username) user.username = username
    if (bio !== undefined) user.bio = bio
    
    await user.save()
    
    res.json({
      id: user._id,
      address: user.address,
      username: user.username,
      walletType: user.walletType,
      ethBalance: user.ethBalance,
      totalBalanceUsd: user.totalBalanceUsd,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
}

