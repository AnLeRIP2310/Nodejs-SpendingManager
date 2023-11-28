const express = require('express')
const router = express.Router()
const apiCtrl = require('../controllers/spendingController')

router.get('/getData', apiCtrl.getData)
router.post('/insertSpendingList', apiCtrl.insertSpendingList)

module.exports = router