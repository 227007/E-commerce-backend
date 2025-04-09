import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    logo: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const companyModel = mongoose.models.Company || mongoose.model("Company", companySchema);

export default companyModel;