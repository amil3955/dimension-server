import { Router } from 'express'
import { getObjects, getObject, createObject } from '../controllers/objectController.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.get('/', getObjects)
router.get('/:id', getObject)
router.post('/', upload.fields([
  { name: 'model', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), createObject)

export default router

