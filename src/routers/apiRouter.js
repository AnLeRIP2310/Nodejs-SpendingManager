const express = require('express')
const router = express.Router()
const apiCtrl = require('../controllers/apiController')

router.get('/', apiCtrl.index)

module.exports = router