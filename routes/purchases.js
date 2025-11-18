import { Router } from 'express'
import { createPurchase, getUserPurchases } from '../controllers/purchaseController.js'

const router = Router()

router.post('/', createPurchase)
router.get('/:address', getUserPurchases)

export default router

