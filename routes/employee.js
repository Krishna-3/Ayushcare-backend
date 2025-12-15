const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const employeeController = require('../controllers/employeeController');

router.use(verifyRoles('employee'));

router.get('/getDashboard', employeeController.getDashboard);

module.exports = router;