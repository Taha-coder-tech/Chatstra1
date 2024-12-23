const express = require('express');
const { search } = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth'); // Middleware for authentication
const router = express.Router();

router.get('/', authenticate, search); // Protected search route

module.exports = router;
