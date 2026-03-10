const Document = require('../models/Document');
const Workspace = require('../models/Workspace');

exports.getDocumentsByWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = await Document.find({ workspace: req.params.workspaceId })
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const { title, workspaceId } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const member = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Not authorized to create documents' });
    }

    const document = await Document.create({
      title: title || 'Untitled',
      workspace: workspaceId,
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
    });

    const populated = await document.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'lastEditedBy', select: 'name email avatar' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('workspace');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const workspace = await Workspace.findById(document.workspace._id || document.workspace);
    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(document);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const workspace = await Workspace.findById(document.workspace);
    const member = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role === 'viewer') {
      return res.status(403).json({ message: 'Not authorized to edit' });
    }

    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    document.lastEditedBy = req.user._id;
    document.version += 1;

    await document.save();

    const populated = await document.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'lastEditedBy', select: 'name email avatar' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const workspace = await Workspace.findById(document.workspace);
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only workspace owner can delete documents' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
