// src/utils/dataService.js - Shared data management for students and attendance

// Storage keys
const STUDENTS_KEY = 'wenidi_students';
const ATTENDANCE_KEY = 'wenidi_attendance';

// Get all students
export const getStudents = () => {
  try {
    const students = localStorage.getItem(STUDENTS_KEY);
    return students ? JSON.parse(students) : [];
  } catch (error) {
    console.error('Error getting students:', error);
    return [];
  }
};

// Add a new student
export const addStudent = (student) => {
  try {
    const students = getStudents();
    
    // Check if student already exists
    const existingStudent = students.find(s => 
      s.student_address.toLowerCase() === student.student_address.toLowerCase()
    );
    
    if (existingStudent) {
      throw new Error('Student with this wallet address already exists');
    }
    
    const newStudent = {
      ...student,
      id: student.id || `STU${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString(),
      registration_type: student.registration_type || 'self' // Default to self registration
    };
    
    students.push(newStudent);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    return newStudent;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

// Check if student is registered by wallet address
export const isStudentRegistered = (walletAddress) => {
  try {
    const students = getStudents();
    return students.some(student => 
      student.student_address.toLowerCase() === walletAddress.toLowerCase() && 
      student.is_active
    );
  } catch (error) {
    console.error('Error checking student registration:', error);
    return false;
  }
};

// Get student by wallet address
export const getStudentByWallet = (walletAddress) => {
  try {
    const students = getStudents();
    return students.find(student => 
      student.student_address.toLowerCase() === walletAddress.toLowerCase() && 
      student.is_active
    );
  } catch (error) {
    console.error('Error getting student by wallet:', error);
    return null;
  }
};

// Get all attendance records
export const getAttendanceRecords = () => {
  try {
    const attendance = localStorage.getItem(ATTENDANCE_KEY);
    return attendance ? JSON.parse(attendance) : [];
  } catch (error) {
    console.error('Error getting attendance records:', error);
    return [];
  }
};

// Get attendance records for a specific student
export const getStudentAttendance = (walletAddress) => {
  try {
    const allAttendance = getAttendanceRecords();
    return allAttendance.filter(record => 
      record.student_address.toLowerCase() === walletAddress.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting student attendance:', error);
    return [];
  }
};

// Mark attendance for a student
export const markAttendance = (walletAddress, date) => {
  try {
    const student = getStudentByWallet(walletAddress);
    if (!student) {
      throw new Error('Student not registered');
    }

    const allAttendance = getAttendanceRecords();
    
    // Check if already marked for today
    const existingRecord = allAttendance.find(record => 
      record.student_address.toLowerCase() === walletAddress.toLowerCase() && 
      record.date === date
    );

    if (existingRecord) {
      throw new Error('Attendance already marked for today');
    }

    // Create new attendance record
    const newRecord = {
      student_id: student.id,
      student_name: student.name,
      student_address: walletAddress,
      date: date,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'present',
      marked_at: new Date().toISOString()
    };

    allAttendance.push(newRecord);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(allAttendance));
    
    return newRecord;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

// Check if attendance is marked for today
export const isAttendanceMarkedToday = (walletAddress, date) => {
  try {
    const allAttendance = getAttendanceRecords();
    return allAttendance.some(record => 
      record.student_address.toLowerCase() === walletAddress.toLowerCase() && 
      record.date === date
    );
  } catch (error) {
    console.error('Error checking today attendance:', error);
    return false;
  }
};

// Get attendance statistics
export const getAttendanceStats = () => {
  try {
    const students = getStudents();
    const attendance = getAttendanceRecords();
    const today = new Date().toISOString().split('T')[0];
    
    const presentToday = attendance.filter(record => 
      record.date === today && record.status === 'present'
    ).length;

    return {
      totalStudents: students.length,
      presentToday: presentToday,
      totalRecords: attendance.length
    };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    return {
      totalStudents: 0,
      presentToday: 0,
      totalRecords: 0
    };
  }
};

// Clear all data (for testing)
export const clearAllData = () => {
  localStorage.removeItem(STUDENTS_KEY);
  localStorage.removeItem(ATTENDANCE_KEY);
};