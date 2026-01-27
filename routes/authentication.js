const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const verifyJWT = require('../middleware/verifyJWT');
const authenticationController = require('../controllers/authenticationController');

router.get('/createOrder', verifyJWT, verifyRoles(['employee']), authenticationController.handleCreateOrder);

router.post('/holderRegister', verifyJWT, verifyRoles(['employee']), authenticationController.handleHolderRegister);

router.post('/hospitalRegister', authenticationController.handleHospitalRegister);

router.post('/employeeRegister', verifyJWT, verifyRoles(['employee', 'admin']), authenticationController.handleEmployeeRegister);

router.post('/login', authenticationController.handleLogin);

router.post('/forgotPassword', authenticationController.forgotPassword);

router.put('/resetPassword', authenticationController.putPassword);

module.exports = router;