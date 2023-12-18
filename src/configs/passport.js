const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Passport Đăng nhập bằng Google
passport.use(
    new GoogleStrategy({
        clientID: '719235217594-6nc20voe0r0u1a3f8nel2hjn39rf3752.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: 'http://localhost:3962/auth/loginGoogle/callback',
        scope: ['email', 'profile']
    }, (accessToken, refreshToken, profile, done) => {
        done(null, profile);
    })
);

// Passport đăng nhập bằng Facebook
passport.use(
    new FacebookStrategy({
        clientID: '1815123525607452',
        clientSecret: '6c57d9184690ed7c40fc5d4d2cf9f210',
        callbackURL: 'http://localhost:3962/auth/loginFacebook/callback',
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