const express = require('express')
const router = express.Router()
const homeCtrl = require('../controllers/homeController')

router.get('/getData', homeCtrl.getData)

module.exports = router