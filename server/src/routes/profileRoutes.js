const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const requireAuth = require('../middleware/requireAuth');

// All profile routes require authentication
router.use(requireAuth);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/password', profileController.changePassword);

module.exports = router;
