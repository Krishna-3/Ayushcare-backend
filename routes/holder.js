const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const holderController = require('../controllers/holderController');
const photoUpload = require('../middleware/upload');

router.use(verifyRoles('admin'));

router.post('/addMember/:holderId', holderController.addMember);

router.get('/getHolder/:holderId', holderController.getHolder);

router.put('/putHolder/:holderId', holderController.putHolder);

router.delete('/deleteMember/:memberId', holderController.deleteMember);

module.exports = router;