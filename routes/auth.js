import { Router } from 'express'
import { saveFullname, saveDetectedWallets, getNonce, verifySignature } from '../controllers/authController.js'

const router = Router()

router.post('/fullname', saveFullname)
router.post('/detected-wallets', saveDetectedWallets)
router.get('/nonce/:address', getNonce)
router.post('/verify', verifySignature)

export default router

