const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('./auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get student profile
router.get('/student/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', req.params.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ profile: data || null });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update student profile
router.post('/student', verifyToken, async (req, res) => {
  try {
    const { name, year, course, gender, contactInfo, department } = req.body;

    const profileData = {
      user_id: req.user.userId,
      name: name || null,
      year: year || null,
      course: course || null,
      gender: gender || null,
      contact_info: contactInfo || null,
      department: department || null
    };

    // Check if profile exists
    const { data: existing } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    let result;
    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('student_profiles')
        .update(profileData)
        .eq('user_id', req.user.userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('student_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ profile: result });
  } catch (error) {
    console.error('Create/update student profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get counsellor profile
router.get('/counsellor/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('counsellor_profiles')
      .select('*')
      .eq('user_id', req.params.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ profile: data || null });
  } catch (error) {
    console.error('Get counsellor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update counsellor profile
router.post('/counsellor', verifyToken, async (req, res) => {
  try {
    const { name, designation, teacherId, gmail, roomNo, phoneNo, department } = req.body;

    if (req.user.userType !== 'counsellor') {
      return res.status(403).json({ error: 'Only counsellors can create counsellor profiles' });
    }

    const profileData = {
      user_id: req.user.userId,
      name: name || null,
      designation: designation || null,
      teacher_id: teacherId || null,
      gmail: gmail || null,
      room_no: roomNo || null,
      phone_no: phoneNo || null,
      department: department || null
    };

    // Check if profile exists
    const { data: existing } = await supabase
      .from('counsellor_profiles')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    let result;
    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('counsellor_profiles')
        .update(profileData)
        .eq('user_id', req.user.userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('counsellor_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ profile: result });
  } catch (error) {
    console.error('Create/update counsellor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all counsellors (for students to browse)
router.get('/counsellors', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('counsellor_profiles')
      .select('id, name, designation, department, room_no, phone_no')
      .order('name');

    if (error) throw error;

    res.json({ counsellors: data || [] });
  } catch (error) {
    console.error('Get counsellors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
