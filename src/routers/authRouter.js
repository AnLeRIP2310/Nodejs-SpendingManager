const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const passport = require('passport');

router.post('/register', authCtrl.register);
router.get('/login', authCtrl.login);

router.get('/checkToken', authCtrl.checkToken);
router.get('/urlPage', authCtrl.urlPage);

router.get('/loginGoogle', passport.authenticate('google'));
router.get('/loginGoogle/callback', passport.authenticate('google', { failureRedirect: '/' }), authCtrl.loginGoogle);


module.exports = router