import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import bcrypt from 'bcrypt';
import userModel from '../database/models/user.model.js';
import { createAccessToken } from '../common/utils/jwt.js';

const SignInResponseType = new GraphQLObjectType({
  name: 'SignInResponse',
  fields: {
    message: { type: GraphQLString },
    id: { type: GraphQLString },
    token: { type: GraphQLString },
  },
});

const mutation = new GraphQLObjectType({
  name: 'RootMutation',
  fields: {
    signUp: {
      type: GraphQLString,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        fullName: { type: GraphQLString },
        userName: { type: GraphQLString },
      },
      resolve: async (_, args) => {
        const exists = await userModel.exists({ email: args.email });
        if (exists) throw new Error('This email is already registered');
        await userModel.create(args);
        return 'Added successfully';
      },
    },
    signIn: {
      type: SignInResponseType,
      args: { email: { type: GraphQLString }, password: { type: GraphQLString } },
      resolve: async (_, { email, password }) => {
        const user = await userModel.findOne({ email }).select('+password').lean();
        if (!user) return { message: 'You have to register first' };
        const valid = await bcrypt.compare(password, user.password || '');
        if (!valid) return { message: 'Invalid password' };
        if (!user.confirmEmail) return { message: 'You have to confirm email first' };
        return { message: 'Welcome', id: String(user._id), token: createAccessToken(user._id) };
      },
    },
  },
});

const query = new GraphQLObjectType({
  name: 'RootQuery',
  fields: { dummyField: { type: GraphQLString, resolve: () => 'GraphQL is running' } },
});

export const authSchema = new GraphQLSchema({ query, mutation });
