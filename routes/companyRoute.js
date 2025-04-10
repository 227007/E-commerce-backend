import express from 'express'
import {createCompany,getAllCompanies,getCompanyById,updateCompany,deleteCompany} from '../controllers/companyController.js';
import auth from '../middleware/auth.js'
import companyAuth from '../middleware/companyAuth.js'

const companyRouter = express.Router()

companyRouter.post('/', auth, companyAuth, createCompany);
companyRouter.get('/', auth, getAllCompanies);
companyRouter.get('/:id', auth, getCompanyById);
companyRouter.put('/:id', auth, companyAuth, updateCompany);
companyRouter.delete('/:id', auth, companyAuth, deleteCompany);


export default companyRouter