import mongoose from 'mongoose'

const walletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    lowercase: true,
    default: null
  },
  balance: {
    type: String,
    default: '0'
  }
}, { _id: false })

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  wallets: {
    type: [walletSchema],
    default: []
  }
})

export default mongoose.model('User', userSchema)

