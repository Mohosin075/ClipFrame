import passport from 'passport'
import { User } from '../../../user/user.model'
import { Strategy as LocalStrategy } from 'passport-local'
import { USER_ROLES, USER_STATUS } from '../../../../../enum/user'

import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
const FacebookStrategy = require('passport-facebook').Strategy
import config from '../../../../../config'
import ApiError from '../../../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const isUserExist = await User.findOne({
          email,
          status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE] },
        })
          .select('+password +authentication')
          .lean()

        if (!isUserExist) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'No account found with this email, please try with valid email or create an account.',
          )
        }

        return done(null, {
          ...isUserExist,
        })
      } catch (err) {
        return done(err)
      }
    },
  ),
)

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.client_id!,
      clientSecret: config.google.client_secret!,
      callbackURL: config.google.callback_url,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      req.body.profile = profile
      req.body.role = USER_ROLES.STUDENT

      try {
        return done(null, req.body)
      } catch (err) {
        return done(err)
      }
    },
  ),
)

passport.use(
  new FacebookStrategy(
    {
      clientID: config.facebook.app_id!,
      clientSecret: config.facebook.app_secret!,
      callbackURL: config.facebook.callback_url,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      passReqToCallback: true,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        // Find or create user
        let user = await User.findOne({ appId: profile.id })

        if (!user) {
          user = new User({
            appId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            profilePhoto: profile.photos?.[0]?.value,
            accessToken: accessToken,
            refreshToken: refreshToken,
          })
          await user.save()
        } else {
          // Update access token if user exists

          await user.save()
        }

        return done(null, user)
      } catch (error) {
        return done(error, null)
      }
    },
  ),
)

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

export default passport
