const express = require('express')
const router = express.Router()
const notedCtrl = require('../controllers/notedController')


router.get('/getData', notedCtrl.getData)
router.get('/getContent', notedCtrl.getContent)
router.get('/searchNoted', notedCtrl.searchNoted)
router.post('/insertNoted', notedCtrl.insertNoted)
router.post('/updateNoted', notedCtrl.updateNoted)
router.post('/deleteNoted', notedCtrl.deleteNoted)

module.exports = router;