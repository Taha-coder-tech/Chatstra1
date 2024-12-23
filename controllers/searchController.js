const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Media = require('../models/mediaModel');

const search = async (req, res) => {
    const { query, type } = req.query; // Search term and type (chat, group, media)

    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        let results = [];

        if (type === 'chat') {
            // Search chats (messages)
            results = await Chat.find({
                $or: [
                    { message: { $regex: query, $options: 'i' } }, // Case-insensitive
                ],
            }).populate('sender receiver', 'name email');
        } else if (type === 'group') {
            // Search groups
            results = await Group.find({
                name: { $regex: query, $options: 'i' },
            }).populate('members', 'name email');
        } else if (type === 'media') {
            // Search media files
            results = await Media.find({
                fileUrl: { $regex: query, $options: 'i' }, // Match media file URLs
            });
        } else {
            return res.status(400).json({ message: 'Invalid search type' });
        }

        res.status(200).json({ results });
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ message: 'Error during search' });
    }
};

module.exports = { search };
