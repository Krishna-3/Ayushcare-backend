const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const employeeController = require('../controllers/employeeController');
const photoUpload = require('../middleware/upload');

router.post('/uploadHolderPhoto/:holderId', verifyRoles(['employee', 'admin']), photoUpload.single('photo'), employeeController.uploadHolderPhoto);

router.post('/uploadEmployeePhoto/:employeeId', verifyRoles(['employee', 'admin']), photoUpload.single('photo'), employeeController.uploadEmployeePhoto);

router.get('/getHolderCard/:holderId', verifyRoles(['employee', 'admin']), employeeController.getHolderCard);

router.use(verifyRoles('employee'));

router.get('/getDashboard', employeeController.getDashboard);

router.get('/getEmployee', employeeController.getEmployee);

router.put('/putEmployee', employeeController.putEmployee);

module.exports = router;