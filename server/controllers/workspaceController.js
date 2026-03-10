const Workspace = require('../models/Workspace');
const User = require('../models/User');

exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    const populated = await workspace.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can invite members' });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === userToInvite._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    workspace.members.push({
      user: userToInvite._id,
      role: role || 'editor',
    });
    await workspace.save();

    const populated = await workspace.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }

    if (req.params.userId === workspace.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the owner' });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await workspace.save();

    const populated = await workspace.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
