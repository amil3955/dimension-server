import { Router } from 'express'
import { getUser, updateUser } from '../controllers/userController.js'

const router = Router()

router.get('/:address', getUser)
router.put('/:address', updateUser)

export default router

