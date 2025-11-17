import mongoose from 'mongoose'

const nonceSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    lowercase: true
  },
  nonce: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Auto-delete after 5 minutes
  }
})

export default mongoose.model('Nonce', nonceSchema)

