const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

router.post('/register', authCtrl.register);
router.get('/login', authCtrl.login);
router.get('/checkToken', authCtrl.checkToken);

module.exports = router