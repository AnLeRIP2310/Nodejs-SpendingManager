const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');


router.get('/checkLogin', authCtrl.checkLogin);
router.get('/Login', authCtrl.Login);
router.post('/Register', authCtrl.Register);
router.post('/ChangePassword', authCtrl.ChangePassword);
router.get('/toggleLockApp', authCtrl.toggleLockApp);
router.get('/urlPage', authCtrl.urlPage);
router.get('/loginGGDrive', authCtrl.loginGGDrive);
router.get('/loginGGDrive/callback', authCtrl.loginGGDriveCallback);
router.get('/logoutGGDrive', authCtrl.logoutGGDrive);

module.exports = router