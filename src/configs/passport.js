require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Passport Đăng nhập bằng Google
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['email', 'profile']
    }, (accessToken, refreshToken, profile, done) => {
        done(null, profile);
    })
);

// Passport đăng nhập bằng Facebook
passport.use(
    new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
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