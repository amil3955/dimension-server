import { Purchase, Object3D } from '../models/index.js'

/**
 * Create a new purchase
 */
export async function createPurchase(req, res) {
  try {
    const { objectId, buyerAddress, txHash } = req.body
    
    const object = await Object3D.findById(objectId)
    if (!object) {
      return res.status(404).json({ error: 'Object not found' })
    }

    const purchase = await Purchase.create({
      objectId: object._id,
      buyerAddress: buyerAddress.toLowerCase(),
      sellerAddress: object.creatorAddress,
      price: object.price,
      txHash
    })
    
    // Update object purchases count
    object.purchases += 1
    await object.save()

    res.status(201).json(purchase)
  } catch (error) {
    console.error('Purchase error:', error)
    res.status(500).json({ error: 'Failed to record purchase' })
  }
}

/**
 * Get purchases by user address
 */
export async function getUserPurchases(req, res) {
  try {
    const purchases = await Purchase.find({ 
      buyerAddress: req.params.address.toLowerCase() 
    }).populate('objectId')
    
    const result = purchases.map(p => ({
      ...p.toObject(),
      object: p.objectId
    }))
    
    res.json(result)
  } catch (error) {
    console.error('Get purchases error:', error)
    res.status(500).json({ error: 'Failed to get purchases' })
  }
}

