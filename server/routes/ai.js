const router = require('express').Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.post('/command', auth, aiController.runCommand);
router.post('/generate-outline', auth, aiController.generateOutline);

module.exports = router;
