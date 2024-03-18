const express = require('express')
const router = express.Router()
const statiscCtrl = require('../controllers/statiscController')

router.get('/getData', statiscCtrl.getData)
router.get('/getDataForChart1', statiscCtrl.getDataForChart1)
router.get('/getDataForChart2', statiscCtrl.getDataForChart2)

module.exports = router