import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
        type: Map,
        of: Number,
        required: true,
        default: {},
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const cartModel = mongoose.models.Company || mongoose.model("Cart", cartSchema);

export default cartModel;
