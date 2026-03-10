const router = require('express').Router();
const auth = require('../middleware/auth');
const documentController = require('../controllers/documentController');

router.get('/workspace/:workspaceId', auth, documentController.getDocumentsByWorkspace);
router.post('/', auth, documentController.createDocument);
router.get('/:id', auth, documentController.getDocument);
router.put('/:id', auth, documentController.updateDocument);
router.delete('/:id', auth, documentController.deleteDocument);

module.exports = router;
