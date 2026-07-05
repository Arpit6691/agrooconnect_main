const Complaint = require('../models/Complaint');

exports.createComplaint = async (req, res) => {
  try {
    req.body.userId = req.user.id;
    const complaint = await Complaint.create(req.body);
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const complaints = req.user.role === 'admin' 
      ? await Complaint.find().populate('userId', 'name email')
      : await Complaint.find({ userId: req.user.id });
      
    res.status(200).json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
