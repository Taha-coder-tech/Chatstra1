// Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./models/userModel'); // Correct the model import path
const Analytics = require('./models/analyticsModel'); // New import for Analytics
const Group = require('./models/groupModel'); // New import for Group

// Import i18next middleware and localization
const i18nextMiddleware = require('i18next-http-middleware');
const i18next = require('./middleware/localization');
const languageRoutes = require('./routes/languageRoutes');

// Load environment variables
dotenv.config();

// Import routes
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const groupRoutes = require('./routes/groupRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const statusRoutes = require('./routes/statusRoutes'); // Added the statusRoutes
const pollRoutes = require('./routes/pollRoutes');  // New import
const messageRoutes = require('./routes/messageRoutes');
require('./services/scheduler'); // Import the scheduler to run the background job

// Connect to the database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Chatstra', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));

// Initialize Express app and middleware
const app = express();
app.use(cors());
app.use(express.json());

// Initialize i18next middleware
app.use(i18nextMiddleware.handle(i18next));

// Serve uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Language routes
app.use('/api/language', languageRoutes);

// Initialize HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Active call tracking
let activeCalls = {};

// Track online users
let usersOnline = {}; // Store userId and socketId mappings

// Store offline messages
let offlineMessages = {};  // Store offline messages

// Socket.IO connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Track message activity and update analytics
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, message, groupId } = data;

        try {
            // If the message is for a group
            if (groupId) {
                // Increment message count for the group
                await Analytics.findOneAndUpdate(
                    { groupId },
                    { $inc: { totalMessages: 1 } },
                    { upsert: true, new: true }
                );

                // Track individual message activity
                await Analytics.updateOne(
                    { groupId },
                    { $push: { groupActivity: { userId: sender, activityType: 'message', timestamp: new Date() } } }
                );

                // Emit message to group
                io.to(groupId).emit('receiveMessage', { sender, message });
            } else {
                // If the message is for a single user, handle accordingly
                if (usersOnline[receiver]) {
                    const chat = await Chat.create({ sender, receiver, message, status: 'delivered' });
                    io.to(receiver).emit('receiveMessage', chat);
                } else {
                    const chat = { sender, receiver, message, status: 'pending' };
                    if (!offlineMessages[receiver]) {
                        offlineMessages[receiver] = [];
                    }
                    offlineMessages[receiver].push(chat);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    // Track user joining/leaving the group
    socket.on('joinGroup', async (userId, groupId) => {
        try {
            await Analytics.updateOne(
                { groupId },
                { $push: { groupActivity: { userId, activityType: 'join', timestamp: new Date() } } }
            );
            console.log(`${userId} joined group ${groupId}`);
        } catch (error) {
            console.error('Error tracking group join:', error);
        }
    });

    socket.on('leaveGroup', async (userId, groupId) => {
        try {
            await Analytics.updateOne(
                { groupId },
                { $push: { groupActivity: { userId, activityType: 'leave', timestamp: new Date() } } }
            );
            console.log(`${userId} left group ${groupId}`);
        } catch (error) {
            console.error('Error tracking group leave:', error);
        }
    });

    // User joins the room
    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        usersOnline[userId] = socket.id;
        console.log(`${userId} joined the room`);

        // Check if the user has any offline messages when they reconnect
        if (offlineMessages[userId]) {
            offlineMessages[userId].forEach(async (message) => {
                try {
                    const chat = await Chat.create(message);
                    io.to(userId).emit('receiveMessage', chat); // Emit message to the user
                } catch (error) {
                    console.error('Error saving offline message:', error);
                }
            });
            delete offlineMessages[userId]; // Clear offline messages once delivered
        }
    });

    // Handle message sending
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, message } = data;

        try {
            if (usersOnline[receiver]) {
                // If the receiver is online, send the message immediately
                const chat = await Chat.create({ sender, receiver, message, status: 'delivered' });
                io.to(receiver).emit('receiveMessage', chat);
            } else {
                // If the receiver is offline, save the message in offline queue
                const chat = { sender, receiver, message, status: 'pending' };

                // Store the message for the offline user
                if (!offlineMessages[receiver]) {
                    offlineMessages[receiver] = [];
                }
                offlineMessages[receiver].push(chat);
                console.log(`Message queued for offline user: ${receiver}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    // Handle call offer
    socket.on('callOffer', (data) => {
        const { offer, receiverId } = data;
        console.log(`Sending call offer to ${receiverId}`);
        socket.to(receiverId).emit('callOffer', offer);
    });

    // Handle call answer
    socket.on('callAnswer', (data) => {
        const { answer, receiverId } = data;
        console.log(`Sending call answer to ${receiverId}`);
        socket.to(receiverId).emit('callAnswer', answer);
    });

    // Handle ICE candidate
    socket.on('sendIceCandidate', (data) => {
        const { candidate, receiverId } = data;
        console.log(`Sending ICE candidate to ${receiverId}`);
        socket.to(receiverId).emit('receiveIceCandidate', candidate);
    });

    // Handle call end
    socket.on('endCall', (data) => {
        const { userId, receiverId } = data;
        console.log(`Ending call with ${receiverId}`);
        socket.to(receiverId).emit('callEnded', userId);
    });

    // Handle real-time media sharing
    socket.on('sendMedia', (data) => {
        const { fileUrl, sender, receiver, group, fileType } = data;

        if (group) {
            io.to(group).emit('receiveMedia', { fileUrl, sender, group, fileType });
        } else {
            io.to(receiver).emit('receiveMedia', { fileUrl, sender, receiver, fileType });
        }
    });

    // Handle message delivery status
    socket.on('messageDelivered', async ({ messageId, receiver }) => {
        try {
            const message = await Media.findById(messageId);
            if (message) {
                message.status = 'delivered';
                await message.save();

                io.to(receiver).emit('messageDelivered', { messageId });
            }
        } catch (error) {
            console.error('Error marking message as delivered:', error);
        }
    });

    // Handle message read status
    socket.on('messageRead', async ({ messageId, receiver }) => {
        try {
            const message = await Media.findById(messageId);
            if (message) {
                message.status = 'read';
                await message.save();

                io.to(receiver).emit('messageRead', { messageId });
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    });

    // Handle message reactions
    socket.on('reactToMessage', (data) => {
        const { messageId, emoji, senderId } = data;

        io.emit('messageReaction', { messageId, emoji, senderId });
    });

    // Handle pinning and unpinning messages
    socket.on('pinMessage', ({ chatId, messageId }) => {
        io.to(chatId).emit('messagePinned', { chatId, messageId });
    });

    socket.on('unpinMessage', ({ chatId, messageId }) => {
        io.to(chatId).emit('messageUnpinned', { chatId, messageId });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        const userId = Object.keys(usersOnline).find(key => usersOnline[key] === socket.id);
        if (userId) {
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() }); // Update lastSeen time
            delete usersOnline[userId]; // Remove the user from online list
            console.log(`${userId} is now offline`);
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Routes
app.use('/api/notifications', notificationRoutes); // User Notification settings 
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/status', statusRoutes); // Added statusRoutes

// Use the new routes
app.use('/api/polls', pollRoutes);  // New route for polls
app.use('/api/messages', messageRoutes); // Use the message routes

// Add the new analytics route at the end
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes); // Add analyticsRoutes

// Default route
app.get('/', (req, res) => res.send('Server is running'));

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
