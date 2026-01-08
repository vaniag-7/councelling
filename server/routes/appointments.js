const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('./auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate Zoom meeting signature
function generateZoomSignature(meetingNumber, role) {
  const apiKey = process.env.ZOOM_SDK_KEY;
  const apiSecret = process.env.ZOOM_SDK_SECRET;
  const timestamp = Date.now() - 30000;
  const msg = Buffer.from(`${apiKey}${meetingNumber}${timestamp}${role}`).toString('base64');
  const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
  const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
  return signature;
}

// Send appointment confirmation email
async function sendAppointmentEmail(studentEmail, counsellorName, date, startTime, endTime, meetingUrl) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: 'Counselling Appointment Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #667eea;">Appointment Confirmed</h2>
        <p>Your counselling appointment has been scheduled successfully.</p>
        <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Counsellor:</strong> ${counsellorName}</p>
          <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        ${meetingUrl ? `<p><strong>Meeting Link:</strong> <a href="${meetingUrl}" style="color: #667eea;">Join Meeting</a></p>` : ''}
        <p style="margin-top: 20px; color: #666;">You will receive a reminder before your appointment.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Get available slots for a counsellor
router.get('/slots/:counsellorId', verifyToken, async (req, res) => {
  try {
    const { date } = req.query;
    const counsellorId = req.params.counsellorId;

    // Get counsellor's availability
    const { data: availability, error: availError } = await supabase
      .from('counsellor_availability')
      .select('*')
      .eq('counsellor_id', counsellorId)
      .eq('day_of_week', new Date(date).getDay())
      .single();

    if (availError && availError.code !== 'PGRST116') {
      throw availError;
    }

    // Get existing appointments for the date
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('counsellor_id', counsellorId)
      .eq('date', date)
      .in('status', ['scheduled', 'confirmed']);

    if (apptError) throw apptError;

    // Generate available slots
    const slots = generateTimeSlots(availability, appointments || []);

    res.json({ slots, availability });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate time slots based on availability
function generateTimeSlots(availability, bookedAppointments) {
  if (!availability) return [];

  const slots = [];
  const startTime = new Date(`2000-01-01T${availability.start_time}`);
  const endTime = new Date(`2000-01-01T${availability.end_time}`);
  const slotDuration = 30; // 30 minutes per slot

  let currentTime = new Date(startTime);

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
    const timeString = currentTime.toTimeString().slice(0, 5);

    // Check if slot is booked
    const isBooked = bookedAppointments.some(apt => {
      const aptStart = new Date(`2000-01-01T${apt.start_time}`);
      const aptEnd = new Date(`2000-01-01T${apt.end_time}`);
      return currentTime < aptEnd && slotEnd > aptStart;
    });

    if (!isBooked) {
      slots.push({
        start_time: timeString,
        end_time: slotEnd.toTimeString().slice(0, 5),
        available: true
      });
    }

    currentTime = slotEnd;
  }

  return slots;
}

// Book appointment
router.post('/book', verifyToken, async (req, res) => {
  try {
    const { counsellorId, date, startTime, endTime, notes } = req.body;

    if (!counsellorId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if slot is still available
    const { data: conflicting, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('counsellor_id', counsellorId)
      .eq('date', date)
      .in('status', ['scheduled', 'confirmed'])
      .or(`start_time.lte.${startTime},end_time.gte.${endTime}`)
      .limit(1);

    if (checkError) throw checkError;

    if (conflicting && conflicting.length > 0) {
      return res.status(409).json({ error: 'Time slot is no longer available' });
    }

    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        student_id: req.user.userId,
        counsellor_id: counsellorId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        status: 'scheduled',
        notes: notes || null
      })
      .select()
      .single();

    if (error) throw error;

    // Get student and counsellor details for email
    const { data: student } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    const { data: counsellorProfile } = await supabase
      .from('counsellor_profiles')
      .select('name, gmail')
      .eq('user_id', counsellorId)
      .single();

    // Create Zoom meeting automatically using OAuth API
    let zoomMeeting = null;
    try {
      // Import Zoom functions (before router export)
      const zoomHelpers = require('./zoom');
      const getZoomAccessToken = zoomHelpers.getZoomAccessToken;
      const createZoomMeeting = zoomHelpers.createZoomMeeting;
      
      const topic = `Counselling Session - ${counsellorProfile?.name || 'Counsellor'}`;
      const meetingDateTime = new Date(`${date}T${startTime}`);
      const startTimeISO = meetingDateTime.toISOString();
      
      // Calculate duration in minutes
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const duration = Math.round((end - start) / 60000);

      const accessToken = await getZoomAccessToken();
      const zoomData = await createZoomMeeting(accessToken, topic, startTimeISO, duration);

      const { data: zoomMeetingData, error: zoomError } = await supabase
        .from('zoom_meetings')
        .insert({
          appointment_id: appointment.id,
          meeting_number: zoomData.meeting_number,
          meeting_password: zoomData.meeting_password,
          start_url: zoomData.start_url,
          join_url: zoomData.join_url
        })
        .select()
        .single();

      if (!zoomError) {
        zoomMeeting = zoomMeetingData;
      }
    } catch (zoomErr) {
      console.error('Error creating Zoom meeting:', zoomErr);
      // Continue without Zoom meeting - appointment is still created
    }

    // Send confirmation email to student
    if (student && student.email) {
      await sendAppointmentEmail(
        student.email,
        counsellorProfile?.name || 'Counsellor',
        date,
        startTime,
        endTime,
        zoomMeeting?.join_url || null
      );
    }

    // Send email to counsellor if email available
    if (counsellorProfile?.gmail) {
      const counsellorMailOptions = {
        from: process.env.EMAIL_USER,
        to: counsellorProfile.gmail,
        subject: 'New Counselling Appointment',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Appointment Scheduled</h2>
            <p>You have a new counselling appointment scheduled.</p>
            <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
              ${zoomMeeting?.join_url ? `<p><strong>Meeting Link:</strong> <a href="${zoomMeeting.join_url}">Join Meeting</a></p>` : ''}
            </div>
          </div>
        `
      };
      await transporter.sendMail(counsellorMailOptions).catch(console.error);
    }

    res.json({ 
      appointment: {
        ...appointment,
        zoomMeeting: zoomMeeting || null
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's appointments
router.get('/my-appointments', verifyToken, async (req, res) => {
  try {
    const isCounsellor = req.user.userType === 'counsellor';
    const idField = isCounsellor ? 'counsellor_id' : 'student_id';

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        student:student_profiles(name, year, course),
        counsellor:counsellor_profiles(name, designation, department)
      `)
      .eq(idField, req.user.userId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    res.json({ appointments: appointments || [] });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reschedule appointment
router.put('/reschedule/:id', verifyToken, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const appointmentId = req.params.id;

    // Verify ownership
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError) throw fetchError;

    const isOwner = appointment.student_id === req.user.userId || 
                    appointment.counsellor_id === req.user.userId;

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check new slot availability
    const { data: conflicting, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('counsellor_id', appointment.counsellor_id)
      .eq('date', date)
      .neq('id', appointmentId)
      .in('status', ['scheduled', 'confirmed'])
      .or(`start_time.lte.${startTime},end_time.gte.${endTime}`)
      .limit(1);

    if (checkError) throw checkError;

    if (conflicting && conflicting.length > 0) {
      return res.status(409).json({ error: 'Time slot is not available' });
    }

    // Update appointment
    const { data: updated, error } = await supabase
      .from('appointments')
      .update({
        date: date,
        start_time: startTime,
        end_time: endTime,
        status: 'rescheduled'
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    res.json({ appointment: updated });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel appointment
router.put('/cancel/:id', verifyToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Verify ownership
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError) throw fetchError;

    const isOwner = appointment.student_id === req.user.userId || 
                    appointment.counsellor_id === req.user.userId;

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update appointment status
    const { data: updated, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    res.json({ appointment: updated });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
