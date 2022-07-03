const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
// const passport = require('passport')
const idChecker = require('../middlewares/idChecker')

// register staff route
router.post('/register-staff', adminController.registerStaff)

// create client from a file
// router.post('/create-client-from-file', adminController.registerClientFromAfile)

// create faculty
router.post('/add-faculty', adminController.addFaculty)

// create facilty
router.post('/add-facilty', adminController.addFacilities)

// create faculty
router.post('/add-faculty-from-file', adminController.createFacultyFromAfile)

// add downloadables
router.post('/add-downloadbles', adminController.addDownloadable)

// create main event
router.put('/create-home-event', adminController.addHomeEvent)

// add image to an event
router.put('/upload-an-image', adminController.addAnImageToEvent)

// set profie pic
router.put('/set-profile-pic', adminController.setProfilePic)

// edit home page event
router.put('/edit-homepage-event', adminController.editEvent)

// add facility service
router.put('/add-facility-service', adminController.addFacilityService)

// add facility service description
router.put('/add-facility-service-description', adminController.addFacilityServiceDescription)

// add facility service tools
router.put('/add-facility-service-tools', adminController.addFacilityServiceTools)


// login staff
router.post('/login', adminController.loginStaff)

/* All get request */

// get all staff
router.get('/get-all-staff', adminController.findAllStaff)
router.post('/mail', adminController.mall)

// get all facilties
router.get('/get-all-facilities', adminController.getAllFacilities)

// get single facilties
router.get('/get-single-facility', adminController.getSingleFacility)

// get single staff
router.get('/get-single-staff', adminController.singleStaff)

// get home event
router.get('/get-home-event', adminController.getHomeEvent)

// get all faculties
router.get('/get-all-faculties-schools-college', adminController.getAllFacultiesSchoolsCollege)

// get single faculty
router.get('/get-single-faculty', adminController.singleFaculty)

// get single department
router.get('/get-single-department', adminController.getSingleDepartment)

// get single program
router.get('/get-single-program', adminController.getSingleProgram)

// get all department
router.get('/get-all-department', adminController.getAllDepartment)

// get all statistics
router.get('/get-statistics', adminController.getStatistics)

// remove event
router.put('/remove-event', adminController.removeEvent)

// edit faculty
router.put('/edit-faculty', adminController.editFaculty)

// edit dean
router.put('/edit-dean', adminController.editDean)

// edit department
router.put('/edit-department', adminController.editDepartment)

// edit hod
router.put('/edit-hod', adminController.editHod)

// edit department program
router.put('/edit-department-program', adminController.editDepartmentProgram)

// edit department staff
router.put('/edit-department-staff', adminController.editDepartmentStaffs)

// add dean
router.put('/add-dean', adminController.addDean)

//add facility director
router.put('/add-facility-director', adminController.addFaciltyDirector)

// add department
router.put('/add-department', adminController.addDepartment)

// add department from file
router.put('/add-department-from-file', adminController.createDepartmentFromAfile)

// add hod
router.put('/add-hod', adminController.addHod)

// add department staff
router.put('/add-department-staff', idChecker.checkId, adminController.addDepartmentStaff)

// add department program
router.put('/add-department-program', adminController.addDepartmentProgram)

// add department program form a file
router.put('/add-department-program-from-file', adminController.createProgranFromAfile)

// add program brochure
router.put('/add-program-brochure', adminController.addProgramBrochure)

// remove dean
router.put('/remove-dean', adminController.removeDean)

// remove department program
router.put('/remove-department-program', adminController.removeDepartmentProgram)

// remove department staff
router.put('/remove-department-staff', adminController.removeDepartmentStaff)

// remove hod
router.put('/remove-hod', adminController.removeHod)

// remove department
router.put('/remove-department', adminController.removeDepartment)

// remove faculty
router.delete('/remove-faculty', adminController.removeFaculty)

module.exports = router
