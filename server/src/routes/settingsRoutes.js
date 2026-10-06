const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const requireAuth = require('../middleware/requireAuth');

// All settings routes require authentication
router.use(requireAuth);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
