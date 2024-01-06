import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fileUpload from 'express-fileupload';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import { globalErrorHandler } from './controllers/error.controller.js';

// Routers
import authRouter from './routes/auth.route.js';
import conversationRouter from './routes/conversation.route.js';
import messageRouter from './routes/message.route.js';
// const userRouter = require('./routes/user.route');

//dotEnv config
dotenv.config();

// calling express function and store into a variable
const app = express();
app.set('trust proxy', 'loopback');

// i) Implemented cors
app.use(cors());
app.options('*', cors());

// ii) Set security HTTP headers
app.use(helmet());

// iii) Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// iv) Limiting request from same IP (its help us from Bruteforce and DOS/DDOS attacks)
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from your IP, please try again in an hour.',
});
app.use('/api', limiter);

// v) Body parser (reading data from body into req.body) and set limit to 10kb on creating and updating documents
app.use(express.json({ limit: '10kb' }));

// vi) Cookie parser
app.use(cookieParser());

//parse json request body
app.use(express.urlencoded({ extended: true }));

// vii) Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// viii) Data sanitization against XSS (Cross-site scripting)
app.use(xss());

// ix) Prevent parameter pollution (pass all the params inside whitelist array which you want to allow in req.query to avoid unnecessary params by a malicious user)
app.use(hpp({ whitelist: [] }));

//gzip compression
app.use(compression());

//file upload
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// 2. Routes
// i) Handling available routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/conversation', conversationRouter);
app.use('/api/v1/message', messageRouter);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/categories', categoryRouter);

// ii) Handling unavailable routes
app.all('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `can not find ${req.originalUrl} on this server`,
  });
});

// 3. Global error handler
app.use(globalErrorHandler);

export default app;
