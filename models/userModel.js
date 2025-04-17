import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    password: {
        type: String,
        required: function () {
            return this.provider === 'local';
        },
        validate: {
            validator: function (v) {
                if (this.provider !== 'local') return true;
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: props => `Password must contain 8+ chars with uppercase, lowercase, number & symbol`
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
    provider: {
        type: String,
        enum: ["facebook", "google", "local"],
        default: "local",
        required: true
    },
    providerId: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    minimize: false,
    timestamps: true
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;