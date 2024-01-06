import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: ObjectId,
      ref: 'User',
    },

    message: {
      type: String,
      trim: true,
    },

    conversation: {
      type: ObjectId,
      ref: 'Conversation',
    },

    files: [],
  },
  {
    collection: 'messages',
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
