const express = require('express')
const router = express.Router()
const settingCtrl = require('../controllers/settingController')

router.get('/getData', settingCtrl.getData)
router.post('/editData', settingCtrl.editData)
router.get('/resetData', settingCtrl.resetData)

module.exports = router