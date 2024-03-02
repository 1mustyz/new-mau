const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const DepartmentSchema = require("./department");

const CollegeSchema = Schema(
  {
    collegeId: {
      type: String,
      required: true,
      unique: [true, "College ID already exist"],
    },
    image: { type: String, default: null },
    collegeName: { type: String, default: null },
    collegeDescription: { type: String, default: null },
    shortNote: { type: String, default: null },
    mission: { type: String, default: null },
    vission: { type: String, default: null },
    dean: { type: Object, default: null },
    departmentList: [DepartmentSchema],
  },
  { timestamps: true }
);

const college = mongoose.model("college", CollegeSchema);
module.exports = college;
