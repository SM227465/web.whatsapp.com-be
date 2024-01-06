import createHttpError from 'http-errors';
import logger from '../configs/logger.config.js';
import {
  createConversation,
  doesConversationExist,
  getUserConversations,
  populateConversation,
} from '../services/conversation.service.js';
import { catchAsync } from '../utils/catch-async.util.js';
import { AppError } from '../utils/error.util.js';
import Conversation from '../models/conversation.model.js';
import User from '../models/userModel.js';

// start

export const createOpenConversation = catchAsync(async (req, res, next) => {
  const senderId = req.user._id;
  const { receiverId } = req.body;

  if (!receiverId) {
    return next(
      new AppError(
        'No receiver was found! Please provide a receiver ID to start the conversation.',
        400
      )
    );
  }

  const isConversationExists = await Conversation.findOne({
    isGroup: false,
    $and: [
      { users: { $elemMatch: { $eq: senderId } } },
      { users: { $elemMatch: { $eq: receiverId } } },
    ],
  })
    .populate('users', '-password')
    .populate('latestMessage');

  if (isConversationExists) {
    console.log('Chat exists', isConversationExists);
  } else {
    // console.log('Chat not exists', isConversationExists);

    const receiver = await User.findOne({ _id: receiverId });

    const newConversation = await Conversation.create({
      name: receiver.fullName,
      isGroup: false,
      users: [senderId, receiverId],
    });

    const conversation = await Conversation.findOne({ _id: newConversation._id }).populate(
      'users',
      '-password'
    );

    console.log('Chat created', conversation);

    res.status(200).json({
      success: true,
      sender: senderId,
      receiver: receiverId,
      conversation: conversation,
    });
  }
});

export const getConversations = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  if (!userId) {
    return next(new AppError('No user found', 400));
  }

  const conversations = await Conversation.find({
    users: { $elemMatch: { $eq: userId } },
  })
    .populate('users', '-password')
    .populate('admin', '-password')
    .populate('latestMessage')
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    conversations,
  });

  // await ConversationModel.find({
  //   users: { $elemMatch: { $eq: user_id } },
  // })
  //   .populate('users', '-password')
  //   .populate('admin', '-password')
  //   .populate('latestMessage')
  //   .sort({ updatedAt: -1 })
  //   .then(async (results) => {
  //     results = await UserModel.populate(results, {
  //       path: 'latestMessage.sender',
  //       select: 'name email picture status',
  //     });
  //     conversations = results;
  //   });
});

export const create_open_conversation = async (req, res, next) => {
  console.log(req.body);
  try {
    const sender_id = req.user.userId;
    const { receiver_id, isGroup } = req.body;
    if (isGroup == false) {
      //check if receiver_id is provided
      if (!receiver_id) {
        logger.error('please provide the user id you wanna start a conversation with !');
        throw createHttpError.BadGateway('Oops...Something went wrong !');
      }
      //check if chat exists
      const existed_conversation = await doesConversationExist(sender_id, receiver_id, false);
      if (existed_conversation) {
        res.json(existed_conversation);
      } else {
        // let receiver_user = await findUser(receiver_id);
        let convoData = {
          name: 'conversation name',
          picture: 'conversation picture',
          isGroup: false,
          users: [sender_id, receiver_id],
        };
        const newConvo = await createConversation(convoData);
        const populatedConvo = await populateConversation(newConvo._id, 'users', '-password');
        res.status(200).json(populatedConvo);
      }
    } else {
      console.log('hnaaaaaaaaaa');
      //it's a group chat
      //check if group chat exists
      const existed_group_conversation = await doesConversationExist('', '', isGroup);
      res.status(200).json(existed_group_conversation);
    }
  } catch (error) {
    next(error);
  }
};

// export const getConversations = async (req, res, next) => {
//   try {
//     const user_id = req.user.userId;
//     const conversations = await getUserConversations(user_id);
//     res.status(200).json(conversations);
//   } catch (error) {
//     next(error);
//   }
// };
export const createGroup = async (req, res, next) => {
  const { name, users } = req.body;
  //add current user to users
  users.push(req.user.userId);
  if (!name || !users) {
    throw createHttpError.BadRequest('Please fill all fields.');
  }
  if (users.length < 2) {
    throw createHttpError.BadRequest('Atleast 2 users are required to start a group chat.');
  }
  let convoData = {
    name,
    users,
    isGroup: true,
    admin: req.user.userId,
    picture: process.env.DEFAULT_GROUP_PICTURE,
  };
  try {
    const newConvo = await createConversation(convoData);
    const populatedConvo = await populateConversation(newConvo._id, 'users admin', '-password');
    res.status(200).json(populatedConvo);
  } catch (error) {
    next(error);
  }
};
