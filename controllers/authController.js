import { v4 as uuidv4 } from 'uuid'
import { ethers } from 'ethers'
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Nonce } from '../models/index.js'
import { getWalletNetWorth } from '../services/moralis.js'

/**
 * Save detected wallets to user
 */
export async function saveDetectedWallets(req, res) {
  try {
    const { userId, detectedWallets } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!detectedWallets || !Array.isArray(detectedWallets)) {
      return res.status(400).json({ error: 'Detected wallets array is required' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Remove duplicate detected wallets (same name, no address) first
    const seenNames = new Set()
    user.wallets = user.wallets.filter(w => {
      // Keep connected wallets (have address)
      if (w.address) {
        return true
      }
      // For detected wallets (no address), keep only the first occurrence of each name
      if (!seenNames.has(w.name)) {
        seenNames.add(w.name)
        return true
      }
      // Remove duplicate detected wallets
      return false
    })

    // Update detected wallets (wallets without addresses)
    // Add detected wallets that don't exist yet, keeping existing connected wallets
    detectedWallets.forEach((walletName) => {
      // Check if this wallet name already exists (either detected or connected)
      const existingIndex = user.wallets.findIndex(w => w.name === walletName)
      
      if (existingIndex === -1) {
        // Add new detected wallet (no address yet)
        user.wallets.push({
          name: walletName,
          address: null,
          balance: '0'
        })
      }
      // If wallet already exists (either detected or connected), skip to prevent duplicates
    })

    await user.save()
    console.log('✅ Detected wallets saved for user:', user.fullname, 'wallets:', detectedWallets)
    
    res.json({ success: true, wallets: user.wallets })
  } catch (error) {
    console.error('Save detected wallets error:', error)
    res.status(500).json({ error: 'Failed to save detected wallets' })
  }
}

/**
 * Save fullname to MongoDB
 */
export async function saveFullname(req, res) {
  try {
    const { fullname } = req.body
    
    if (!fullname || !fullname.trim()) {
      return res.status(400).json({ error: 'Full name is required' })
    }

    // Create user with just fullname (no wallets yet)
    const user = await User.create({
      fullname: fullname.trim(),
      wallets: []
    })

    console.log('✅ Fullname saved:', user.fullname, 'User ID:', user._id)
    
    res.json({ 
      userId: user._id.toString(),
      fullname: user.fullname
    })
  } catch (error) {
    console.error('Save fullname error:', error)
    res.status(500).json({ error: 'Failed to save fullname' })
  }
}

/**
 * Generate nonce for wallet authentication
 */
export async function getNonce(req, res) {
  try {
    const { address } = req.params
    const nonce = `Sign this message to authenticate with Dimension Market.\n\nNonce: ${uuidv4()}`
    
    await Nonce.findOneAndUpdate(
      { address: address.toLowerCase() },
      { address: address.toLowerCase(), nonce },
      { upsert: true, new: true }
    )
    
    res.json({ nonce })
  } catch (error) {
    console.error('Nonce error:', error)
    res.status(500).json({ error: 'Failed to generate nonce' })
  }
}

/**
 * Verify wallet signature and authenticate user
 */
export async function verifySignature(req, res) {
  try {
    const { address, signature, walletType, balance, userId } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    
    // Get nonce from MongoDB
    const nonceDoc = await Nonce.findOne({ address: address.toLowerCase() })
    
    if (!nonceDoc) {
      return res.status(400).json({ error: 'Nonce not found or expired. Request a new one.' })
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(nonceDoc.nonce, signature)
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Delete nonce after use
    await Nonce.deleteOne({ address: address.toLowerCase() })

    // Get total wallet net worth from Moralis
    console.log('📊 Fetching wallet net worth from Moralis...')
    const totalBalanceUsd = await getWalletNetWorth(address)
    console.log('💰 Total balance USD:', totalBalanceUsd)

    const normalizedAddress = address.toLowerCase()
    
    // Find user by ID (from fullname submission)
    let user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please enter your full name first.' })
    }
    
    // First check if wallet already exists by address (connected wallet) - prevent duplicates by address
    let existingWalletIndex = user.wallets.findIndex(
      w => w.address && w.address.toLowerCase() === normalizedAddress
    )
    
    if (existingWalletIndex >= 0) {
      // Wallet with this address already exists - update it
      user.wallets[existingWalletIndex].balance = balance || user.wallets[existingWalletIndex].balance
      if (walletType && user.wallets[existingWalletIndex].name !== walletType) {
        user.wallets[existingWalletIndex].name = walletType
      }
    } else {
      // No wallet with this address exists - check if detected wallet with same name exists
      existingWalletIndex = user.wallets.findIndex(
        w => w.name === walletType && !w.address
      )
      
      if (existingWalletIndex >= 0) {
        // Found detected wallet with same name - update it with address and balance
        user.wallets[existingWalletIndex].address = normalizedAddress
        user.wallets[existingWalletIndex].balance = balance || '0'
      } else {
        // No wallet with this name or address exists - add new wallet
        // Check if there's any wallet with this name to prevent duplicates
        const existingByName = user.wallets.findIndex(w => w.name === walletType)
        
        if (existingByName === -1) {
          // No wallet with this name exists - safe to add
          user.wallets.push({
            name: walletType || 'unknown',
            address: normalizedAddress,
            balance: balance || '0'
          })
        } else {
          // Wallet with same name exists (shouldn't happen normally, but handle it)
          // If it's a connected wallet with different address, update balance only
          console.warn('Wallet with same name exists, updating balance:', walletType)
          if (user.wallets[existingByName].address) {
            user.wallets[existingByName].balance = balance || user.wallets[existingByName].balance
          }
        }
      }
    }
    
    // Remove any duplicate wallets after update (by address - keep first occurrence)
    const seenAddresses = new Set()
    user.wallets = user.wallets.filter(w => {
      if (!w.address) return true // Keep detected wallets
      if (!seenAddresses.has(w.address.toLowerCase())) {
        seenAddresses.add(w.address.toLowerCase())
        return true
      }
      return false // Remove duplicate addresses
    })
    
    await user.save()
    console.log('✅ Wallet added to user:', user.fullname, 'wallet:', normalizedAddress)

    // Get the wallet that was just connected
    const connectedWallet = user.wallets.find(w => w.address && w.address.toLowerCase() === normalizedAddress)

    if (!connectedWallet) {
      return res.status(500).json({ error: 'Failed to find connected wallet' })
    }

    res.json({ 
      user: {
        id: user._id,
        fullname: user.fullname,
        wallets: user.wallets
      },
      connectedWallet: {
        address: connectedWallet.address,
        name: connectedWallet.name,
        balance: connectedWallet.balance
      },
      token: `${normalizedAddress}_${Date.now()}` 
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

