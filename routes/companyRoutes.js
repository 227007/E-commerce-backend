import express from 'express';
import {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
    getCompanyOwners,
    addCompanyOwner
} from '../controllers/companyController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getCompanies)
    .post(protect, admin, createCompany);

router.route('/:id')
    .get(protect, getCompanyById)
    .put(protect, updateCompany)
    .delete(protect, admin, deleteCompany);

router.route('/:id/owners')
    .get(protect, admin, getCompanyOwners)
    .post(protect, admin, addCompanyOwner);

export default router;