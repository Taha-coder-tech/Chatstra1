const express = require('express');
const { setStatus, getStatus } = require('../controllers/statusController');
const router = express.Router();

// Route to update user status
router.put('/:userId/status', setStatus);

// Route to get user status
router.get('/:userId/status', getStatus);

module.exports = router;
