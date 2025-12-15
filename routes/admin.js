const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const adminController = require('../controllers/adminController');

router.use(verifyRoles('admin'));

router.get('/getUnapprovedHospitals', adminController.getUnapprovedHospitals);

router.get('/getHoldersByEmployees/:employeeId', adminController.getHoldersByEmployees);

router.get('/getPatientsByHospitals/:hospitalId', adminController.getPatientsByHospitals);

router.get('/getDashboard', adminController.getDashboard);

router.post('/approveHospital/:hospitalId', adminController.approveHospital);

module.exports = router;