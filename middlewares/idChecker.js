const Faculty = require('../models/faculty')
const School = require('../models/school')
const College = require('../models/college')
const Center = require('../models/center')


exports.checkId = async (req,res,next) => {
    const {staff} = req.body
    const collegeResult = await College.findOne({"departmentList.staffList.staffId":staff.staffId},{"departmentList": 1})
    const facultyResult = await Faculty.findOne({"departmentList.staffList.staffId":staff.staffId},{"departmentList": 1})
    const centerResult = await Center.findOne({"staffList.staffId":staff.staffId},{"staffList": 1})
    const schoolResult = await School.findOne({"departmentList.staffList.staffId":staff.staffId},{"departmentList": 1})

    if (collegeResult==null  && facultyResult==null && centerResult==null && schoolResult==null) next()
    else res.json({success:false, message:"This user ID already existed"})
    
}
