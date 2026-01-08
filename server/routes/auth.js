const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Supabase client for database operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Supabase client for auth (uses anon key for client-side auth)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Student Signup with Supabase Auth
router.post('/student/signup', async (req, res) => {
  try {
    const { email, password, name, year, course, gender, contactInfo, department } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: 'student'
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create user record in users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        user_type: 'student'
      })
      .select()
      .single();

    if (userError) {
      // If user creation fails, try to get existing user
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!existingUser) {
        throw userError;
      }
    }

    // Create student profile
    if (name || year || course || department) {
      await supabaseAdmin
        .from('student_profiles')
        .insert({
          user_id: authData.user.id,
          name: name || null,
          year: year || null,
          course: course || null,
          gender: gender || null,
          contact_info: contactInfo || null,
          department: department || null
        });
    }

    // Generate session token
    const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError) {
      return res.status(400).json({ error: sessionError.message });
    }

    res.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        userType: 'student'
      },
      session: sessionData.session
    });
  } catch (error) {
    console.error('Student signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Login with Supabase Auth
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user profile
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        userType: 'student'
      },
      session: data.session
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Counsellor Login (Direct access with teacher_id)
router.post('/counsellor/login', async (req, res) => {
  try {
    const { teacherId, name } = req.body;

    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    // Find counsellor by teacher_id
    const { data: counsellorProfile, error: profileError } = await supabaseAdmin
      .from('counsellor_profiles')
      .select('*, user_id')
      .eq('teacher_id', teacherId)
      .single();

    if (profileError || !counsellorProfile) {
      return res.status(404).json({ error: 'Counsellor not found' });
    }

    // Get user record
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', counsellorProfile.user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate JWT token for counsellor
    const token = jwt.sign(
      {
        userId: user.id,
        userType: 'counsellor',
        teacherId: teacherId
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Longer session for counsellors
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: 'counsellor',
        teacherId: teacherId,
        name: counsellorProfile.name
      }
    });
  } catch (error) {
    console.error('Counsellor login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Token Middleware
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  // Try Supabase token first (for students)
  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (!error && data.user) {
      req.user = {
        userId: data.user.id,
        userType: 'student',
        supabaseToken: token
      };
      return next();
    }
  } catch (error) {
    // Supabase token failed, try JWT
  }
  
  // Fallback to JWT token (for counsellors)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (jwtError) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    let userData;

    if (req.user.supabaseToken) {
      // Student - get from Supabase Auth
      const { data: { user }, error } = await supabaseAuth.auth.getUser(req.user.supabaseToken);
      if (error) throw error;

      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      userData = {
        id: user.id,
        email: user.email,
        userType: 'student'
      };
    } else {
      // Counsellor - get from JWT
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', req.user.userId)
        .single();

      if (error) throw error;

      userData = {
        id: user.id,
        email: user.email,
        userType: 'counsellor'
      };
    }

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
