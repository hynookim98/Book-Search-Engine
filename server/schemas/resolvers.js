const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }

      return User.findOne({ _id: context.user._id }).select('-__v -password');
    },
  },

  Mutation: {
    signUp: (parent, args) => User.create(args)
      .then(user => ({ token: signToken(user), user })),

    logIn: (parent, { email, password }) => User.findOne({ email })
      .then((user) => {
        if (!user) {
          throw new AuthenticationError('Incorrect credentials');
        }

        return user.isCorrectPassword(password).then((correctPw) => {
          if (!correctPw) {
            throw new AuthenticationError('Incorrect credentials');
          }

          return { token: signToken(user), user };
        });
      }),

    addToLibrary: (parent, { bookData }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      return User.findByIdAndUpdate(
        { _id: context.user._id },
        { $push: { savedBooks: bookData } },
        { new: true }
      );
    },

    removeFromLibrary: (parent, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      return User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
    },
  },
};

module.exports = resolvers;