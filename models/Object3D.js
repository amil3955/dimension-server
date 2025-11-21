import mongoose from 'mongoose'

const objectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['characters', 'vehicles', 'architecture', 'nature', 'props', 'abstract'],
    required: true
  },
  creatorAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  modelUrl: String,
  thumbnailUrl: String,
  views: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Object', objectSchema)

