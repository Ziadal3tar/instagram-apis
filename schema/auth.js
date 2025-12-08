import { GraphQLID, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { AuthenticationError } from 'apollo-server-express';
import userModel from "../DB/model/user.model.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SignInResponseType = new GraphQLObjectType({
  name: 'SignInResponse',
  fields: {
    message: { type: GraphQLString },
    id: { type: GraphQLString },
    token: { type: GraphQLString }
  }
});

const rootMutation = new GraphQLObjectType({
  name: 'rootMutation',
  fields: {
    signUp: {
      type: GraphQLString,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        fullName: { type: GraphQLString },
        userName: { type: GraphQLString },
        registerType: { type: GraphQLString }
      },
      resolve: async (parent, args) => {
        const { email, password, fullName, userName, registerType } = args;
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
          throw new AuthenticationError('This email is already registered');
        }

        const newUser = new userModel({ email, password, fullName, userName });
        await newUser.save();

        return "Added successfully";
      }
    },
    signIn: {
      type: SignInResponseType || GraphQLString,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const { email, password } = args;
        const user = await userModel.findOne({ email });
        if (!user) {
          return { message: 'You have to register first' };
        }
console.log(parseInt(process.env.SALTROUND));
        const isPasswordValid = bcrypt.compareSync(password, user.password,parseInt(process.env.SALTROUND));
        if (!isPasswordValid) {
          return { message: 'Invalid password' };

        }

        if (!user.confirmEmail) {
          return { message: 'You have to confirm email first' };
        }

        const token = jwt.sign(
          { id: user._id, isLoggedIn: true },
          process.env.tokenSignature,
          { expiresIn: '2d' }
        );
        return {
          message: 'Welcome',
          id: user._id.toString(), 
          token
        };

      }
    }
  }
});

const rootQuery = new GraphQLObjectType({
  name: 'rootQuery',
  fields: {
    dummyField: {
      type: GraphQLString,
      resolve: () => "Hello, this is a dummy field"
    }
  }
});

export const auth = new GraphQLSchema({
  query: rootQuery,
  mutation: rootMutation
});
