import passport from 'passport'
import { User } from '../../../user/user.model'
import { Strategy as LocalStrategy } from 'passport-local'
import { USER_ROLES, USER_STATUS } from '../../../../../enum/user'

import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
const FacebookStrategy = require('passport-facebook').Strategy
import config from '../../../../../config'
import ApiError from '../../../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { Socialintegration } from '../../../socialintegration/socialintegration.model'
import { ISocialintegration } from '../../../socialintegration/socialintegration.interface'
import { exchangeForLongLivedToken } from '../../../../../helpers/graphAPIHelper'
import { CustomAuthServices } from '../../custom.auth/custom.auth.service'

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
      req.body.role = USER_ROLES.USER

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
      req: any,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        // Check if user exists
        let user = await User.findOne({ appId: profile.id })

        const longLiveToken = await exchangeForLongLivedToken(
          accessToken,
          config.facebook.app_id!,
          config.facebook.app_secret!,
        )

        // console.log({tokenInfo})

        const payload = {
          platform: 'facebook',
          appId: profile.id,
          accessToken: longLiveToken?.accessToken,
          refreshToken,
        }
        let localAccessToken
        let localRefreshToken

        if (!user) {
          // Create new user
          user = new User({
            appId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            profilePhoto: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
            verified: true,
          })
          const savedUser = (await user.save())._id.toString()

          await Socialintegration.create({
            ...payload,
            user: savedUser,
          })

          const localToken = await CustomAuthServices.socialLogin(
            profile.id,
            '',
          )
          localAccessToken = localToken.accessToken
          localRefreshToken = localToken.refreshToken
        } else {
          // Update existing user
          // user.accessToken = accessToken
          // user.refreshToken = refreshToken
          user.email = profile.emails?.[0]?.value || user.email
          user.name = profile.displayName || user.name
          // user.profilePhoto = profile.photos?.[0]?.value || user.profilePhoto
          const savedUser = (await user.save())._id.toString()

          const isSocialInegrationExist = await Socialintegration.findOne({
            appId: profile.id,
          })
          if (!isSocialInegrationExist) {
            await Socialintegration.create({
              ...payload,
              user: savedUser,
            })
          }

          await Socialintegration.findOneAndUpdate(
            {
              appId: profile.id,
            },
            {
              accessToken: longLiveToken?.accessToken,
            },
            {
              new: true,
            },
          )

          const localToken = await CustomAuthServices.socialLogin(
            profile.id,
            '',
          )
          localAccessToken = localToken.accessToken
          localRefreshToken = localToken.refreshToken
        }

        return done(null, {
          _id: user._id,
          email: user.email,
          name: user.name,
          accessToken: localAccessToken, // add
          refreshToken: localRefreshToken, // add
        })
      } catch (error) {
        console.error('❌ Facebook strategy error:', error)
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
