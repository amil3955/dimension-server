import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    default: function() {
      return `user_${this.address.slice(0, 8)}`
    }
  },
  walletType: {
    type: String,
    enum: ['metamask', 'phantom', 'trust', 'coinbase', 'brave', 'rabby', 'okx', 'unknown'],
    default: 'unknown'
  },
  ethBalance: {
    type: String,
    default: '0'
  },
  totalBalanceUsd: {
    type: String,
    default: '0'
  },
  avatar: String,
  bio: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('User', userSchema)

