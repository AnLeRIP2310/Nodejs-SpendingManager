const express = require('express')
const router = express.Router()
const settingCtrl = require('../controllers/settingController')

router.get('/getData', settingCtrl.getData)
router.post('/editData', settingCtrl.editData)
router.get('/resetData', settingCtrl.resetData)
router.get('/checkLastEntry', settingCtrl.checkLastEntry)
router.get('/syncData', settingCtrl.syncData)
router.get('/backupData', settingCtrl.backupData)
router.get('/checkSyncStatus', settingCtrl.checkSyncStatus)
router.post('/handleSyncSpendList', settingCtrl.handleSyncSpendList)
router.post('/handleSyncSpendItem', settingCtrl.handleSyncSpendItem)


module.exports = router