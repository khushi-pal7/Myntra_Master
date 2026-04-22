const express = require('express');
const router = express.Router();
const { isAuthenticateuser } = require('../Middelwares/authuser.js');
const { uploadFitProfile, processTryOn } = require('../controller/TryOnController');

router.post('/user/fit-profile/:id', isAuthenticateuser, uploadFitProfile);
router.post('/user/try-on/:id', isAuthenticateuser, processTryOn);

module.exports = router;
