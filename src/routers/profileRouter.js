const express = require('express')
const router = express.Router()
const profileCrl = require('../controllers/profileController')

router.get('/getData', profileCrl.getData)
router.post('/changePassword', profileCrl.changePassword)

module.exports = router