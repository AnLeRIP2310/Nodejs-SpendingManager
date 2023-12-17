const passport = require('passport');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Passport Đăng nhập bằng Google
passport.use(
    new GoogleStrategy({
        clientID: process.env.GG_CLIENT_ID,
        clientSecret: process.env.GG_CLIENT_SECRET,
        callbackURL: process.env.GG_CALLBACK_URL,
        scope: ['email', 'profile']
    }, (accessToken, refreshToken, profile, done) => {
        done(null, profile);
    })
);

// Passport đăng nhập bằng Facebook
passport.use(
    new FacebookStrategy({
        clientID: process.env.FB_CLIENT_ID,
        clientSecret: process.env.FB_CLIENT_SECRET,
        callbackURL: process.env.FB_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'photos', 'email', 'gender', 'birthday']
    }, (accessToken, refreshToken, profile, done) => {
        done(null, profile);
    })
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    // Lấy người dùng từ id
    done(null, user);
});

module.exports = passport;