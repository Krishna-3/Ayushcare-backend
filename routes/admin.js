const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const adminController = require('../controllers/adminController');
const photoUpload = require('../middleware/upload');

router.use(verifyRoles('admin'));

router.get('/getUnapprovedHospitals', adminController.getUnapprovedHospitals);

router.get('/getHoldersByEmployees/:employeeId', adminController.getHoldersByEmployees);

router.get('/getPatientsByHospitals/:hospitalId', adminController.getPatientsByHospitals);

router.get('/getDashboard', adminController.getDashboard);

router.post('/approveHospital/:hospitalId', adminController.approveHospital);

router.get('/getEmployeeCard/:employeeId', adminController.getEmployeeCard);

router.delete('/deleteEmployee/:employeeId', adminController.deleteEmployee);

router.delete('/deleteHospital/:hospitalId', adminController.deleteHospital);

module.exports = router;