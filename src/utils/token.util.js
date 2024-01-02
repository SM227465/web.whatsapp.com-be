import jwt from 'jsonwebtoken';
import dotEnv from 'dotenv';

dotEnv.config();

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} = process.env;

export const generateToken = async (userId, tokenType) => {
  return jwt.sign(
    { id: userId, type: tokenType },
    tokenType === 'access' ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET,
    {
      expiresIn: tokenType === 'access' ? ACCESS_TOKEN_EXPIRES_IN : REFRESH_TOKEN_EXPIRES_IN,
    }
  );
};

// export const sign = async (payload, expiresIn, secret) => {
//   return new Promise((resolve, reject) => {
//     jwt.sign(
//       payload,
//       secret,
//       {
//         expiresIn: expiresIn,
//       },
//       (error, token) => {
//         if (error) {
//           logger.error(error);
//           reject(error);
//         } else {
//           resolve(token);
//         }
//       }
//     );
//   });
// };

// export const verify = async (token, secret) => {
//   return new Promise((resolve, reject) => {
//     jwt.verify(token, secret, (error, payload) => {
//       if (error) {
//         logger.error(error);
//         resolve(null);
//       } else {
//         resolve(payload);
//       }
//     });
//   });
// };
