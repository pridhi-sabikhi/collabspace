const router = require('express').Router();
const auth = require('../middleware/auth');
const workspaceController = require('../controllers/workspaceController');

router.get('/', auth, workspaceController.getWorkspaces);
router.post('/', auth, workspaceController.createWorkspace);
router.post('/:id/invite', auth, workspaceController.inviteMember);
router.delete('/:id/members/:userId', auth, workspaceController.removeMember);

module.exports = router;
