import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { catchAsync } from '../utils/catch-async.util.js';
import { AppError } from '../utils/error.util.js';

export const sendMessage = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { message, conversationId, files } = req.body;

  if (!userId) {
    return next(new AppError('No user found!', 400));
  }

  if (!conversationId || (!message && !files)) {
    return next(new AppError('A conversation ID and a message or a file are required', 400));
  }

  const conversation = await Conversation.findOne({ _id: conversationId });

  if (!conversation) {
    return next(new AppError('No conversation found', 400));
  }

  const messageData = {
    sender: userId,
    message: message,
    conversation: conversationId,
    files: files || [],
  };

  const newMessage = await Message.create(messageData);

  if (!newMessage) {
    return next(new AppError('Oops, something went wrong during the creation message', 500));
  }

  const messageWithPopulatedData = await Message.findById(newMessage._id)
    .populate({
      path: 'sender',
      select: 'fullName picture',
      model: 'User',
    })
    .populate({
      path: 'conversation',
      select: 'name isGroup users',
      model: 'Conversation',
      populate: {
        path: 'users',
        select: 'fullName email picture status',
        model: 'User',
      },
    });

  await Conversation.findByIdAndUpdate(messageWithPopulatedData._id, {
    latestMessage: messageWithPopulatedData,
  });

  res.status(200).json({
    success: true,
    message: messageWithPopulatedData,
  });
});

/*
export const sendMessage = async (req, res, next) => {
  try {
    const user_id = req.user.userId;
    const { message, convo_id, files } = req.body;
    if (!convo_id || (!message && !files)) {
      logger.error("Please provider a conversation id and a message body");
      return res.sendStatus(400);
    }
    const msgData = {
      sender: user_id,
      message,
      conversation: convo_id,
      files: files || [],
    };
    let newMessage = await createMessage(msgData);
    let populatedMessage = await populateMessage(newMessage._id);
    await updateLatestMessage(convo_id, newMessage);
    res.json(populatedMessage);
  } catch (error) {
    next(error);
  }
};
*/
export const getMessages = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    messages: 'Hi',
  });
  // try {
  //   const convo_id = req.params.convo_id;
  //   if (!convo_id) {
  //     logger.error('Please add a conversation id in params.');
  //     res.sendStatus(400);
  //   }
  //   const messages = await getConvoMessages(convo_id);
  //   res.json(messages);
  // } catch (error) {
  //   next(error);
  // }
});
