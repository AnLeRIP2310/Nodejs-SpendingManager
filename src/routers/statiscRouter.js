const express = require('express')
const router = express.Router()
const statiscCtrl = require('../controllers/statiscController')

router.get('/getData', statiscCtrl.getData)

module.exports = router