import { MORALIS_API_KEY, MORALIS_BASE_URL } from '../config/moralis.js'

/**
 * Get wallet net worth from Moralis API
 * @param {string} address - Wallet address
 * @returns {Promise<string|null>} Total balance in USD
 */
export async function getWalletNetWorth(address) {
  try {
    const chains = ['eth', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base']
    const chainParams = chains.map(c => `chains=${c}`).join('&')
    
    const response = await fetch(
      `${MORALIS_BASE_URL}/wallets/${address}/net-worth?${chainParams}`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      console.error('Moralis API error:', response.status)
      return null
    }
    
    const data = await response.json()
    return data.total_networth_usd || '0'
  } catch (error) {
    console.error('Failed to get wallet net worth:', error)
    return null
  }
}

