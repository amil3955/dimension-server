import mongoose from 'mongoose'

const purchaseSchema = new mongoose.Schema({
  objectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Object',
    required: true
  },
  buyerAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  sellerAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  price: String,
  txHash: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Purchase', purchaseSchema)

