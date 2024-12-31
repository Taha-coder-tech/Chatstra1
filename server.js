// Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./models/userModel'); // Correct the model import path

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const groupRoutes = require('./routes/groupRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const statusRoutes = require('./routes/statusRoutes'); // Added the statusRoutes

// Import the new routes
const pollRoutes = require('./routes/pollRoutes');  // New import

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

// Serve uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Socket.IO connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a room
    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`${userId} joined the room`);
    });

    // Mark user as online
    socket.on('user-online', (userId) => {
        usersOnline[userId] = socket.id; // Store the user's socket ID
        console.log(`${userId} is now online`);
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

    // Handle real-time messaging
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, message } = data;
        console.log('Message received:', data);

        try {
            const chat = await Chat.create({ sender, receiver, message });
            io.emit('receiveMessage', chat);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ sender, receiver, group }) => {
        if (group) {
            io.to(group).emit('userTyping', { sender, group });
        } else {
            io.to(receiver).emit('userTyping', { sender });
        }
    });

    socket.on('stopTyping', ({ sender, receiver, group }) => {
        if (group) {
            io.to(group).emit('userStoppedTyping', { sender, group });
        } else {
            io.to(receiver).emit('userStoppedTyping', { sender });
        }
    });

    // Handle group messages
    socket.on('sendGroupMessage', async (data) => {
        const { groupId, sender, message } = data;

        try {
            const group = await Group.findById(groupId);
            if (!group) {
                console.error('Group not found');
                return;
            }

            const newMessage = { sender, message };
            group.messages.push(newMessage);
            await group.save();

            io.to(groupId).emit('receiveGroupMessage', newMessage);
        } catch (error) {
            console.error('Error sending group message:', error);
        }
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
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/status', statusRoutes); // Added statusRoutes

// Use the new routes
app.use('/api/polls', pollRoutes);  // New route for polls

// Default route
app.get('/', (req, res) => res.send('Server is running'));

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
