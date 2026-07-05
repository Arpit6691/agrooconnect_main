const express = require('express');
const { createComplaint, getComplaints, updateComplaintStatus } = require('../controllers/complaintController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createComplaint)
  .get(protect, getComplaints);

router.route('/:id/status')
  .put(protect, updateComplaintStatus);

module.exports = router;
