const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const passport = require('passport');

router.post('/register', authCtrl.register);
router.get('/login', authCtrl.login);

router.get('/checkToken', authCtrl.checkToken);
router.get('/urlPage', authCtrl.urlPage);
router.get('/CUToken', authCtrl.CUToken);

router.get('/loginGoogle', passport.authenticate('google'));
router.get('/loginGoogle/callback', passport.authenticate('google', { failureRedirect: '/' }), authCtrl.loginGoogle);

router.get('/loginFacebook', passport.authenticate('facebook'));
router.get('/loginFacebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), authCtrl.loginFacebook);

router.get('/loginGGDrive', authCtrl.loginGGDrive);
router.get('/loginGGDrive/callback', authCtrl.loginGGDriveCallback);
router.get('/logoutGGDrive', authCtrl.logoutGGDrive);

module.exports = router