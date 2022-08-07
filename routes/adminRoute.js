const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const facilityController = require('../controllers/facilityController')
const campusLifeController = require('../controllers/campusLifeController')
const alumniController = require('../controllers/alumniController')
const interventionController = require('../controllers/interventionController')
const galleryController = require('../controllers/galleryController')
const oerController = require('../controllers/oerController')



// const passport = require('passport')
const idChecker = require('../middlewares/idChecker')

// register staff route
router.post('/register-staff', adminController.registerStaff)

// create client from a file
// router.post('/create-client-from-file', adminController.registerClientFromAfile)

// create faculty
router.post('/add-faculty', adminController.addFaculty)

// create facilty
router.post('/add-facilty', facilityController.addFacilities)

// create interventions
router.post('/add-intervention', interventionController.addIntervention)

// create faculty
router.post('/add-faculty-from-file', adminController.createFacultyFromAfile)

// add downloadables
router.post('/add-downloadbles', adminController.addDownloadable)

// add portals
router.post('/add-portals-links', adminController.addPortalLinks)

// create gallery
router.post('/create-gallery', galleryController.addGallery)

// create oer
router.post('/create-oer', oerController.addOer)

// create main event
router.put('/create-home-event', adminController.addHomeEvent)

// create main event
router.put('/create-campus-life', campusLifeController.addCampusLife)

// create alumni event
router.put('/create-alumni', alumniController.addAlumni)

// add image to an event
router.put('/upload-an-image', adminController.addAnImageToEvent)

// add campus life image
router.put('/upload-campus-life-image', campusLifeController.addCampusLifeImage)

// add alumni image
router.put('/upload-alumni-image', alumniController.addAlumniImage)

// add gallery image
router.put('/upload-gallery-image', galleryController.addGalleryImage)

// add oer image
router.put('/upload-oer-file', oerController.addOerFile)

// add image about leadership
router.put('/upload-about-leadership-image', adminController.addAboutImages)

// add image intervention
router.put('/upload-intervention-image', interventionController.addInterventionListImage)

// add about
router.put('/add-about-leadership', adminController.createAbout)

// set profie pic
router.put('/set-profile-pic', adminController.setProfilePic)

// edit home page event
router.put('/edit-homepage-event', adminController.editEvent)

// edit campus life
router.put('/edit-campus-life', campusLifeController.editCampusLife)

// edit alumni
router.put('/edit-alumni', alumniController.editAlumni)

// edit gallery
router.put('/edit-gallery', galleryController.editGallery)

// edit oer
router.put('/edit-oer', oerController.editOer)

// edit about page
router.put('/edit-about-leadership', adminController.editAbout)

// add facility service
router.put('/add-facility-service', facilityController.addFacilityService)

// add facility service description
router.put('/add-facility-service-description', facilityController.addMoreFacilityServiceDescription)

// add facility service tools
router.put('/add-facility-service-tools', facilityController.addFacilityServiceTools)

// add facility service tools image
router.put('/add-facility-service-tools-image', facilityController.addFacilityServiceToolImage)

// login staff
router.post('/login', adminController.loginStaff)

/* All get request */

// get all staff
router.get('/get-all-staff', adminController.findAllStaff)
router.post('/mail', adminController.mall)

// get all academy staff
router.get('/get-department-academy-staff', adminController.getDepartmentAcademyStaff)

// get all facilties
router.get('/get-all-facilities', facilityController.getAllFacilities)

// get single facilties
router.get('/get-single-facility', facilityController.getSingleFacility)

// get single staff
router.get('/get-single-staff', adminController.singleStaff)

// get home event
router.get('/get-home-event', adminController.getHomeEvent)

// get campus life
router.get('/get-campus-life', campusLifeController.getCampusLife)

// get alumni
router.get('/get-alumni', alumniController.getAlumni)

// get all gallery
router.get('/get-all-gallery', galleryController.getGallery)

// get all oer
router.get('/get-all-oer', oerController.getOer)

// get home event
router.get('/get-about-leadership', adminController.getAboutLeadership)

// get single principal officer
router.get('/get-single-principal-officer', adminController.getSinglePrincipalOfficer)

// get single mainEvents
router.get('/get-single-main-event', adminController.getSingleMainEvents)

// get single programs
router.get('/get-single-program-event', adminController.getSingleProgramsEvents)

// get single newsEvents
router.get('/get-single-news-event', adminController.getSingleNewsEvents)

// get all faculties
router.get('/get-all-faculties-schools-college', adminController.getAllFacultiesSchoolsCollege)

// get all interventions
router.get('/get-all-interventions', interventionController.getAllInterventions)

// get single faculty
router.get('/get-single-faculty', adminController.singleFaculty)

// get single department
router.get('/get-single-department', adminController.getSingleDepartment)

// get single program
router.get('/get-single-program', adminController.getSingleProgram)

// get all program
router.get('/get-all-programs', adminController.allPrograms)

// get all department
router.get('/get-all-department', adminController.getAllDepartment)

// get all statistics
router.get('/get-statistics', adminController.getStatistics)

// all portals
router.get('/get-all-portals-with-pagination', adminController.getAllPortalsWithPagination)

// all paginated download
router.get('/get-all-download-with-pagination', adminController.getAllDownloadsWithPagination)

// remove event
router.put('/remove-event', adminController.removeEvent)

// remove campus life event
router.put('/remove-campus-life-event', campusLifeController.removeCampusLifeEvent)

// remove alumni  event
router.put('/remove-alumni-event', alumniController.removeAlumniEvent)

// remove about
router.put('/remove-about-leadership', adminController.removeAboutLeadershipContent)

// edit faculty
router.put('/edit-faculty', adminController.editFaculty)

// edit facility
router.put('/edit-facility', facilityController.editFacility)

// edit intervention
router.put('/edit-intervention', interventionController.editIntervention)

// edit intervention list
router.put('/edit-intervention-list', interventionController.editInterventionList)

// edit facility service
router.put('/edit-facility-service', facilityController.editFacilityService)

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

// edit portal link
router.put('/edit-portal-link', adminController.editPortalLink)

// add dean
router.put('/add-dean', adminController.addDean)

//add facility director
router.put('/add-facility-director', facilityController.addFaciltyDirector)

// add department
router.put('/add-department', adminController.addDepartment)

// add intervention list
router.put('/add-intervention-list', interventionController.addInterventionList)

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

// remove all department program
router.put('/remove-all-department-program', adminController.removeAllDepartmentProgram)

// remove serviceTool
router.put('/remove-service-serviceTool', facilityController.removeServiceTool)


// remove department staff
router.put('/remove-department-staff', adminController.removeDepartmentStaff)

// remove hod
router.put('/remove-hod', adminController.removeHod)

// remove department
router.put('/remove-department', adminController.removeDepartment)

// remove service
router.put('/remove-service', facilityController.removeService)

// remove intervention list
router.put('/remove-intervention-list', interventionController.removeInterventionList)

// remove intervention
router.delete('/remove-intervention', interventionController.removeIntervention)

// remove gallery
router.delete('/remove-gallery', galleryController.removeGallery)

// remove oer
router.delete('/remove-oer', oerController.removeOer)

// remove faculty
router.delete('/remove-faculty', adminController.removeFaculty)

// remove facility
router.delete('/remove-facility', facilityController.removeFacility)

// remove portal links
router.delete('/delete-a-portal-link', adminController.deletePortalLink)

// remove downloadable
router.delete('/delete-a-downloadable', adminController.deleteDownloadable)

module.exports = router
