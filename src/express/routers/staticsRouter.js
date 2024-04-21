const express = require('express')
const router = express.Router()
const staticsCtrl = require('../controllers/staticsController')

router.get('/getData', staticsCtrl.getData)
router.get('/getDataForChart1', staticsCtrl.getDataForChart1)
router.get('/getDataForChart2', staticsCtrl.getDataForChart2)
router.get('/getIncomeData', staticsCtrl.getIncomeData)
router.post('/addIncome', staticsCtrl.addIncome)
router.post('/editIncome', staticsCtrl.editIncome)
router.post('/delIncome', staticsCtrl.delIncome)
router.post('/autoAddIncome', staticsCtrl.autoAddIncome)

module.exports = router