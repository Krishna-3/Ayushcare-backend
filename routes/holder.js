const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const holderController = require('../controllers/holderController');
const photoUpload = require('../middleware/upload');

router.use(verifyRoles('holder'));

router.get('/getMembers', holderController.getMembers);

router.post('/addMember', holderController.addMember);

router.get('/getHolder', holderController.getHolder);

router.put('/putHolder', holderController.putHolder);

router.delete('/deleteMember/:memberId', holderController.deleteMember);

module.exports = router;