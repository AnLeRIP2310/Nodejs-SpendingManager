const express = require('express')
const router = express.Router()
const spendingCtrl = require('../controllers/spendingController')

router.get('/getData', spendingCtrl.getData)
router.post('/insertSpendList', spendingCtrl.insertSpendingList)
router.get('/getSpendingForSpendList', spendingCtrl.getSpendingForSpendList)
router.get('/getListNameSpending', spendingCtrl.getListNameSpending)
router.post('/insertSpending', spendingCtrl.insertSpending)
router.post('/updateSpending', spendingCtrl.updateSpending)
router.post('/deleteSpending', spendingCtrl.deleteSpending)
router.get('/calculateTotalPrice', spendingCtrl.calculateTotalPrice)
router.get('/calculateItemPrice', spendingCtrl.calculateItemPrice)
router.get('/getSpendViews', spendingCtrl.getSpendViews)

module.exports = router