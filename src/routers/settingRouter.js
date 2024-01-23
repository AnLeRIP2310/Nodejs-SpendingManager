const express = require('express')
const router = express.Router()
const settingCtrl = require('../controllers/settingController')

router.get('/getData', settingCtrl.getData)
router.post('/editData', settingCtrl.editData)
router.get('/resetData', settingCtrl.resetData)
router.get('/checkLastEntry', settingCtrl.checkLastEntry)

module.exports = router