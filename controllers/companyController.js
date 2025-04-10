import Company from '../models/companyModel.js';

// Create a new company
const createCompany = async (req, res) => {
    try {
        const { name, description } = req.body;
        const company = await Company.create({
            name,
            description,
            createdBy: req.user._id
        });
        res.status(201).json({ 
            success: true, 
            message: "Company created successfully",
            data: company 
        });
    } catch (error) {
        console.error("Error creating company:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to create company",
            error: error.message 
        });
    }
};

// Get all companies
const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().populate('createdBy', 'name email');
        res.status(200).json({
            success: true,
            message: "Companies retrieved successfully",
            data: companies
        });
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch companies",
            error: error.message
        });
    }
};

// Get single company by ID
const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id).populate('createdBy', 'name email');
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Company retrieved successfully",
            data: company
        });
    } catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch company",
            error: error.message
        });
    }
};

// Update company
const updateCompany = async (req, res) => {
    try {
        const { name, description } = req.body;
        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true, runValidators: true }
        );
        if (!updatedCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found for update"
            });
        }
        if (company.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized action" });
        }

        company.name = name;
        company.description = description;
        updatedCompany = await company.save();
        res.status(200).json({
            success: true,
            message: "Company updated successfully",
            data: updatedCompany
        });
    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update company",
            error: error.message
        });
    }
};

// Delete company
const deleteCompany = async (req, res) => {
    try {
        const deletedCompany = await Company.findByIdAndDelete(req.params.id);
        if (!deletedCompany) {
            return res.status(404).json({
                success: false,
                message: "Company not found for deletion"
            });
        }
        if (company.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized action" });
        }

        await company.deleteOne();
        res.status(200).json({
            success: true,
            message: "Company deleted successfully",
            data: deletedCompany
        });
    } catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete company",
            error: error.message
        });
    }
};

export { createCompany,getAllCompanies,getCompanyById,updateCompany,deleteCompany };