import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return done(null, false, { message: 'User not found' });
        }

        if (user.isOAuth) {
            return done(null, false, { message: 'This account was registered via social media' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});