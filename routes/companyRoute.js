import express from 'express'
import {createCompany,getAllCompanies,getCompanyById,updateCompany,deleteCompany} from '../controllers/companyController.js';
import auth from '../middleware/auth.js'
import companyAuth from '../middleware/companyAuth.js'

const companyRouter = express.Router()

companyRouter.post('/', auth, companyAuth, createCompany)

export default companyRouter