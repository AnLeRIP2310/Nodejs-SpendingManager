const express = require('express')
const router = express.Router()
const spendlistCtrl = require('../controllers/spendlistController')

router.get('/getData', spendlistCtrl.getData)
router.post('/editSpendlist', spendlistCtrl.editSpendlist)

module.exports = router