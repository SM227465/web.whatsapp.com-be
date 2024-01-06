import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { validatePhoneNumber } from '../utils/phoneNumberValidator.js';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide your first name'],
      minlength: [2, 'First name should not be less than 2 characters'],
      maxlength: [50, 'First name should not be more than 50 characters'],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, 'Please provide your last name'],
      minlength: [2, 'Last name should not be less than 2 characters'],
      maxlength: [50, 'Last name should not be more than 50 characters'],
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      default: '',
    },

    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid Email! Please provide a valid email address'],
    },

    countryCode: {
      type: String,
      required: [true, 'Please provide country code for number'],
      minlength: [2, 'Country code should not me less than 2 characters'],
      maxlength: [4, 'Country code should not be more than 4 characters'],
    },

    phoneNumber: {
      type: Number,
      required: [true, 'Please provide your phone number'],
      unique: true,
      validate: [validatePhoneNumber, 'Invalid phone number! Please provide a valid phone number'],
    },

    picture: {
      type: String,
      default:
        'https://res.cloudinary.com/dkd5jblv5/image/upload/v1675976806/Default_ProfilePicture_gjngnb.png',
    },
    status: {
      type: String,
      default: 'Hey there ! I am using whatsapp',
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password should contain at least 8 characters'],
      maxlength: [16, 'Password should not be more than 16 characters'],
      select: false,
    },

    confirmPassword: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This validation method works only on create() and save()
        validator: function (confirmPassword) {
          return confirmPassword === this.password;
        },
        message: 'Passwords are not same',
      },
    },

    passwordChangedAt: { type: Date, select: false },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    collection: 'users',
    timestamps: true,
  }
);
/*Note - Pre middleware functions are executed one after another, when each middleware calls next.*/

// i) Password Hashing - encrypt user's password before save to DB
userSchema.pre('save', async function (next) {
  // checking if password is modified, if not return to next()
  if (!this.isModified('password')) {
    return next();
  }

  // if password is modified, hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // delete the confirmPassword before save to DB and calling next()
  this.confirmPassword = undefined;
  next();
});

// ii)
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// 2. Instance methods
// i) Password comparing between user password in DB and provided password by user
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// ii) checking if password is changed after JWT issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimestamp < changedTimestamp;
  }

  // By default false: means not changed
  return false;
};

// iii) Generating a password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
