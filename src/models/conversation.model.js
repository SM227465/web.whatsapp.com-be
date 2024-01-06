import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Conversation name is required'],
      trim: true,
    },

    isGroup: {
      type: Boolean,
      required: true,
      default: false,
    },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    collection: 'conversations',
    timestamps: true,
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
