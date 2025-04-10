import mongoose from "mongoose";
import { type } from "os";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartDate: { type: Object, default: {} },
    role: {
        type: String,
        enum: ["admin", "company", "customer"],
        default: "customer",
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }
}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel