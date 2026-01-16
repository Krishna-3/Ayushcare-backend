const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const hospitalController = require('../controllers/hospitalController');
const photoUpload = require('../middleware/upload');
const verifyAdminApproved = require('../middleware/verifyAdminApproved');

router.use(verifyRoles('hospital'));

router.get('/getDoctors', hospitalController.getDoctors);

router.post('/addDoctor', hospitalController.addDoctor);

router.post('/uploadPhoto', photoUpload.single('photo'), hospitalController.uploadPhoto);

router.get('/getHospital', hospitalController.getHospital);

router.put('/putHospital', hospitalController.putHospital);

router.get('/getPhoto', hospitalController.getPhoto);

router.delete('/deleteDoctor/:doctorId', hospitalController.deleteDoctor);

router.use(verifyAdminApproved);

router.get('/getPatients', hospitalController.getPatients);

router.get('/getHolderMembers/:holderId', hospitalController.getHolderMembers);

router.post('/addPatient/:patientId', hospitalController.addPatient);

router.delete('/deletePatient/:patientId', hospitalController.deletePatient);

module.exports = router;