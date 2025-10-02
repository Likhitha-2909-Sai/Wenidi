module wenidi::attendance_system {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;
    const E_STUDENT_NOT_FOUND: u64 = 3;
    const E_ALREADY_MARKED: u64 = 4;
    const E_UNAUTHORIZED: u64 = 5;

    // Structs
    struct AttendanceRecord has store, copy, drop {
        student_id: String,
        student_address: address,
        timestamp: u64,
        date: String,
        status: String, // "present" or "absent"
    }

    struct Student has store, copy, drop {
        id: String,
        name: String,
        student_address: address,
        email: String,
        is_active: bool,
    }

    struct AttendanceSystem has key {
        admin: address,
        students: vector<Student>,
        attendance_records: vector<AttendanceRecord>,
        attendance_events: EventHandle<AttendanceMarkedEvent>,
        student_events: EventHandle<StudentRegisteredEvent>,
    }

    // Events
    struct AttendanceMarkedEvent has drop, store {
        student_id: String,
        student_address: address,
        timestamp: u64,
        status: String,
    }

    struct StudentRegisteredEvent has drop, store {
        student_id: String,
        name: String,
        student_address: address,
        email: String,
    }

    // Initialize the attendance system
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        let attendance_system = AttendanceSystem {
            admin: admin_addr,
            students: vector::empty<Student>(),
            attendance_records: vector::empty<AttendanceRecord>(),
            attendance_events: account::new_event_handle<AttendanceMarkedEvent>(admin),
            student_events: account::new_event_handle<StudentRegisteredEvent>(admin),
        };
        
        move_to(admin, attendance_system);
    }

    // Register a new student (admin only)
    public entry fun register_student(
        admin: &signer,
        student_id: String,
        name: String,
        student_address: address,
        email: String,
    ) acquires AttendanceSystem {
        let admin_addr = signer::address_of(admin);
        assert!(exists<AttendanceSystem>(admin_addr), E_NOT_INITIALIZED);
        
        let system = borrow_global_mut<AttendanceSystem>(admin_addr);
        assert!(system.admin == admin_addr, E_NOT_ADMIN);

        let student = Student {
            id: student_id,
            name,
            student_address,
            email,
            is_active: true,
        };

        vector::push_back(&mut system.students, student);

        // Emit student registration event
        event::emit_event<StudentRegisteredEvent>(
            &mut system.student_events,
            StudentRegisteredEvent {
                student_id,
                name,
                student_address,
                email,
            },
        );
    }

    // Mark attendance (student can mark their own)
    public entry fun mark_attendance(
        student: &signer,
        admin_address: address,
        date: String,
    ) acquires AttendanceSystem {
        let student_addr = signer::address_of(student);
        assert!(exists<AttendanceSystem>(admin_address), E_NOT_INITIALIZED);
        
        let system = borrow_global_mut<AttendanceSystem>(admin_address);
        
        // Find student in the system
        let student_found = false;
        let student_id = string::utf8(b"");
        let i = 0;
        let len = vector::length(&system.students);
        
        while (i < len) {
            let current_student = vector::borrow(&system.students, i);
            if (current_student.student_address == student_addr && current_student.is_active) {
                student_found = true;
                student_id = current_student.id;
                break
            };
            i = i + 1;
        };
        
        assert!(student_found, E_STUDENT_NOT_FOUND);

        // Check if attendance already marked for today
        let j = 0;
        let records_len = vector::length(&system.attendance_records);
        while (j < records_len) {
            let record = vector::borrow(&system.attendance_records, j);
            if (record.student_address == student_addr && record.date == date) {
                assert!(false, E_ALREADY_MARKED);
            };
            j = j + 1;
        };

        // Create attendance record
        let current_time = timestamp::now_seconds();
        let attendance_record = AttendanceRecord {
            student_id,
            student_address: student_addr,
            timestamp: current_time,
            date,
            status: string::utf8(b"present"),
        };

        vector::push_back(&mut system.attendance_records, attendance_record);

        // Emit attendance event
        event::emit_event<AttendanceMarkedEvent>(
            &mut system.attendance_events,
            AttendanceMarkedEvent {
                student_id,
                student_address: student_addr,
                timestamp: current_time,
                status: string::utf8(b"present"),
            },
        );
    }

    // Get all students (view function)
    #[view]
    public fun get_students(admin_address: address): vector<Student> acquires AttendanceSystem {
        assert!(exists<AttendanceSystem>(admin_address), E_NOT_INITIALIZED);
        let system = borrow_global<AttendanceSystem>(admin_address);
        system.students
    }

    // Get attendance records for a specific student
    #[view]
    public fun get_student_attendance(
        admin_address: address,
        student_address: address
    ): vector<AttendanceRecord> acquires AttendanceSystem {
        assert!(exists<AttendanceSystem>(admin_address), E_NOT_INITIALIZED);
        let system = borrow_global<AttendanceSystem>(admin_address);
        
        let student_records = vector::empty<AttendanceRecord>();
        let i = 0;
        let len = vector::length(&system.attendance_records);
        
        while (i < len) {
            let record = vector::borrow(&system.attendance_records, i);
            if (record.student_address == student_address) {
                vector::push_back(&mut student_records, *record);
            };
            i = i + 1;
        };
        
        student_records
    }

    // Get all attendance records (admin only)
    #[view]
    public fun get_all_attendance(admin_address: address): vector<AttendanceRecord> acquires AttendanceSystem {
        assert!(exists<AttendanceSystem>(admin_address), E_NOT_INITIALIZED);
        let system = borrow_global<AttendanceSystem>(admin_address);
        system.attendance_records
    }

    // Check if student exists
    #[view]
    public fun is_student_registered(admin_address: address, student_address: address): bool acquires AttendanceSystem {
        if (!exists<AttendanceSystem>(admin_address)) {
            return false
        };
        
        let system = borrow_global<AttendanceSystem>(admin_address);
        let i = 0;
        let len = vector::length(&system.students);
        
        while (i < len) {
            let student = vector::borrow(&system.students, i);
            if (student.student_address == student_address && student.is_active) {
                return true
            };
            i = i + 1;
        };
        
        false
    }

    // Get system admin
    #[view]
    public fun get_admin(admin_address: address): address acquires AttendanceSystem {
        assert!(exists<AttendanceSystem>(admin_address), E_NOT_INITIALIZED);
        let system = borrow_global<AttendanceSystem>(admin_address);
        system.admin
    }
}