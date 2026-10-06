const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/', ledgerController.getLedger);
router.get('/:personId', ledgerController.getPersonLedger);

module.exports = router;
