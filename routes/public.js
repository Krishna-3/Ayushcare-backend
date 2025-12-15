const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/getLocations', publicController.getLocations);

router.get('/getHospitals', publicController.getHospitals);

router.get('/getAllHospitals', publicController.getAllHospitals);

router.get('/hospital/:hospitalId', publicController.getHospitalDetails);

router.post('/contact', publicController.contact);

module.exports = router;