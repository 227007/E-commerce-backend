import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (value) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: "Please enter a valid email"
        }
    },
    password: {
        type: String,
        required: function () {
            return !this.isOAuth;
        }
    },
    cartData: {
        type: Object,
        default: {}
    },
    role: {
        type: String,
        enum: ["admin", "company", "customer"],
        default: "customer",
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },
    isOAuth: {
        type: Boolean,
        default: false
    },
    googleId: String,
    facebookId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    minimize: false,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
        }
    }
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;