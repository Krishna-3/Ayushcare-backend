const express = require('express');
const router = express.Router();
const verifyRoles = require('../middleware/verifyRole');
const holderController = require('../controllers/holderController');

router.use(verifyRoles('holder'));

router.get('/getMembers', holderController.getMembers);

router.post('/addMember', holderController.addMember);

router.delete('/deleteMember/:memberId', holderController.deleteMember);

module.exports = router;