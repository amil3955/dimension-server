import { Object3D, User } from '../models/index.js'

/**
 * Get all objects with optional filters
 */
export async function getObjects(req, res) {
  try {
    const { category, sort, search } = req.query
    let query = {}

    if (category && category !== 'all') {
      query.category = category
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    let sortOption = {}
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 }
        break
      case 'price-high':
        sortOption = { price: -1 }
        break
      case 'popular':
        sortOption = { views: -1 }
        break
      case 'newest':
      default:
        sortOption = { createdAt: -1 }
    }

    const objects = await Object3D.find(query).sort(sortOption)
    res.json(objects)
  } catch (error) {
    console.error('Get objects error:', error)
    res.status(500).json({ error: 'Failed to get objects' })
  }
}

/**
 * Get single object by ID
 */
export async function getObject(req, res) {
  try {
    const object = await Object3D.findById(req.params.id)
    if (!object) {
      return res.status(404).json({ error: 'Object not found' })
    }
    
    // Increment views
    object.views += 1
    await object.save()

    // Get creator info
    const creator = await User.findOne({ 'wallets.address': object.creatorAddress.toLowerCase() })
    
    res.json({ 
      ...object.toObject(), 
      creator: creator ? {
        fullname: creator.fullname,
        wallets: creator.wallets
      } : null 
    })
  } catch (error) {
    console.error('Get object error:', error)
    res.status(500).json({ error: 'Failed to get object' })
  }
}

/**
 * Create new object
 */
export async function createObject(req, res) {
  try {
    const { name, description, price, category, creatorAddress } = req.body
    
    if (!req.files?.model || !req.files?.thumbnail) {
      return res.status(400).json({ error: 'Model and thumbnail are required' })
    }

    const object = await Object3D.create({
      name,
      description,
      price,
      category,
      creatorAddress: creatorAddress.toLowerCase(),
      modelUrl: `/uploads/${req.files.model[0].filename}`,
      thumbnailUrl: `/uploads/${req.files.thumbnail[0].filename}`
    })

    res.status(201).json(object)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to create object' })
  }
}

