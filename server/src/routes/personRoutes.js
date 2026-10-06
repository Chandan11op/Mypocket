const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/', personController.getPersons);
router.get('/search', personController.searchPersons);

module.exports = router;
