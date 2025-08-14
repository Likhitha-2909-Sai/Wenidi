module wenidi_addr::attendance_system {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use std::timestamp;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_std::table::{Self, Table};
    use aptos_std::smart_table::{Self, SmartTable};

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_USER_NOT_FOUND: u64 = 2;
    const E_ALREADY_REGISTERED: u64 = 3;
    const E_INVALID_USER_TYPE: u64 = 4;
    const E_ATTENDANCE_ALREADY_MARKED: u64 = 5;

    // User types
    const USER_TYPE_STUDENT: u8 = 1;
    const USER_TYPE_TEACHER: u8 = 2;
    const USER_TYPE_ADMIN: u8 = 3;

    // Structs
    struct User has store, copy, drop {
        address: address,
        name: String,
        user_type: u8,
        registration_time: u64,
    }

    struct AttendanceRecord has store, copy, drop {
        user_address: address,
        date: String,
        check_in_time: u64,
        check_out_time: u64,
        is_present: bool,
        marked_by: address,
    }

    struct AttendanceSystem has key {
        admin: address,
        users: SmartTable<address, User>,
        attendance_records: SmartTable<String, vector<AttendanceRecord>>, // date -> records
        daily_attendance: SmartTable<address, SmartTable<String, AttendanceRecord>>, // user -> date -> record
        user_registration_events: EventHandle<UserRegistrationEvent>,
        attendance_marked_events: EventHandle<AttendanceMarkedEvent>,
    }

    // Events
    struct UserRegistrationEvent has drop, store {
        user_address: address,
        name: String,
        user_type: u8,
        timestamp: u64,
    }

    struct AttendanceMarkedEvent has drop, store {
        user_address: address,
        date: String,
        check_in_time: u64,
        is_present: bool,
        marked_by: address,
        timestamp: u64,
    }

    // Initialize the attendance system (called by admin)
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        let attendance_system = AttendanceSystem {
            admin: admin_addr,
            users: smart_table::new(),
            attendance_records: smart_table::new(),
            daily_attendance: smart_table::new(),
            user_registration_events: account::new_event_handle<UserRegistrationEvent>(admin),
            attendance_marked_events: account::new_event_handle<AttendanceMarkedEvent>(admin),
        };

        // Register admin user
        let admin_user = User {
            address: admin_addr,
            name: string::utf8(b"System Admin"),
            user_type: USER_TYPE_ADMIN,
            registration_time: timestamp::now_seconds(),
        };

        smart_table::add(&mut attendance_system.users, admin_addr, admin_user);
        smart_table::add(&mut attendance_system.daily_attendance, admin_addr, smart_table::new());

        move_to(admin, attendance_system);
    }

    // Register a new user (students and teachers)
    public entry fun register_user(
        account: &signer,
        name: String,
        user_type: u8
    ) acquires AttendanceSystem {
        let user_addr = signer::address_of(account);
        let attendance_system = borrow_global_mut<AttendanceSystem>(@wenidi_addr);

        assert!(user_type == USER_TYPE_STUDENT || user_type == USER_TYPE_TEACHER, E_INVALID_USER_TYPE);
        assert!(!smart_table::contains(&attendance_system.users, user_addr), E_ALREADY_REGISTERED);

        let user = User {
            address: user_addr,
            name,
            user_type,
            registration_time: timestamp::now_seconds(),
        };

        smart_table::add(&mut attendance_system.users, user_addr, user);
        smart_table::add(&mut attendance_system.daily_attendance, user_addr, smart_table::new());

        // Emit registration event
        event::emit_event(&mut attendance_system.user_registration_events, UserRegistrationEvent {
            user_address: user_addr,
            name,
            user_type,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Mark attendance (can be called by the user themselves or by admin/teacher)
    public entry fun mark_attendance(
        marker: &signer,
        user_address: address,
        date: String,
        is_present: bool
    ) acquires AttendanceSystem {
        let marker_addr = signer::address_of(marker);
        let attendance_system = borrow_global_mut<AttendanceSystem>(@wenidi_addr);

        // Verify authorization
        assert!(
            marker_addr == user_address || 
            is_admin(marker_addr, &attendance_system.users) || 
            is_teacher(marker_addr, &attendance_system.users),
            E_NOT_AUTHORIZED
        );

        // Verify user exists
        assert!(smart_table::contains(&attendance_system.users, user_address), E_USER_NOT_FOUND);

        let current_time = timestamp::now_seconds();
        
        // Check if attendance already marked for this date
        let user_attendance = smart_table::borrow_mut(&mut attendance_system.daily_attendance, user_address);
        assert!(!smart_table::contains(user_attendance, date), E_ATTENDANCE_ALREADY_MARKED);

        let attendance_record = AttendanceRecord {
            user_address,
            date,
            check_in_time: current_time,
            check_out_time: 0,
            is_present,
            marked_by: marker_addr,
        };

        // Add to user's daily attendance
        smart_table::add(user_attendance, date, attendance_record);

        // Add to global attendance records
        if (!smart_table::contains(&attendance_system.attendance_records, date)) {
            smart_table::add(&mut attendance_system.attendance_records, date, vector::empty<AttendanceRecord>());
        };
        
        let daily_records = smart_table::borrow_mut(&mut attendance_system.attendance_records, date);
        vector::push_back(daily_records, attendance_record);

        // Emit attendance event
        event::emit_event(&mut attendance_system.attendance_marked_events, AttendanceMarkedEvent {
            user_address,
            date,
            check_in_time: current_time,
            is_present,
            marked_by: marker_addr,
            timestamp: current_time,
        });
    }

    // Mark checkout time
    public entry fun mark_checkout(
        user: &signer,
        date: String
    ) acquires AttendanceSystem {
        let user_addr = signer::address_of(user);
        let attendance_system = borrow_global_mut<AttendanceSystem>(@wenidi_addr);

        let user_attendance = smart_table::borrow_mut(&mut attendance_system.daily_attendance, user_addr);
        assert!(smart_table::contains(user_attendance, date), E_USER_NOT_FOUND);

        let attendance_record = smart_table::borrow_mut(user_attendance, date);
        attendance_record.check_out_time = timestamp::now_seconds();

        // Update global records as well
        let daily_records = smart_table::borrow_mut(&mut attendance_system.attendance_records, date);
        let len = vector::length(daily_records);
        let i = 0;
        while (i < len) {
            let record = vector::borrow_mut(daily_records, i);
            if (record.user_address == user_addr) {
                record.check_out_time = timestamp::now_seconds();
                break
            };
            i = i + 1;
        };
    }

    // View functions
    #[view]
    public fun get_user_info(user_address: address): User acquires AttendanceSystem {
        let attendance_system = borrow_global<AttendanceSystem>(@wenidi_addr);
        assert!(smart_table::contains(&attendance_system.users, user_address), E_USER_NOT_FOUND);
        *smart_table::borrow(&attendance_system.users, user_address)
    }

    #[view]
    public fun get_user_attendance(user_address: address, date: String): AttendanceRecord acquires AttendanceSystem {
        let attendance_system = borrow_global<AttendanceSystem>(@wenidi_addr);
        let user_attendance = smart_table::borrow(&attendance_system.daily_attendance, user_address);
        *smart_table::borrow(user_attendance, date)
    }

    #[view]
    public fun get_daily_attendance(date: String): vector<AttendanceRecord> acquires AttendanceSystem {
        let attendance_system = borrow_global<AttendanceSystem>(@wenidi_addr);
        if (smart_table::contains(&attendance_system.attendance_records, date)) {
            *smart_table::borrow(&attendance_system.attendance_records, date)
        } else {
            vector::empty<AttendanceRecord>()
        }
    }

    #[view]
    public fun is_user_registered(user_address: address): bool acquires AttendanceSystem {
        let attendance_system = borrow_global<AttendanceSystem>(@wenidi_addr);
        smart_table::contains(&attendance_system.users, user_address)
    }

    #[view]
    public fun get_admin_address(): address acquires AttendanceSystem {
        let attendance_system = borrow_global<AttendanceSystem>(@wenidi_addr);
        attendance_system.admin
    }

    // Helper functions
    fun is_admin(user_addr: address, users: &SmartTable<address, User>): bool {
        if (smart_table::contains(users, user_addr)) {
            let user = smart_table::borrow(users, user_addr);
            user.user_type == USER_TYPE_ADMIN
        } else {
            false
        }
    }

    fun is_teacher(user_addr: address, users: &SmartTable<address, User>): bool {
        if (smart_table::contains(users, user_addr)) {
            let user = smart_table::borrow(users, user_addr);
            user.user_type == USER_TYPE_TEACHER
        } else {
            false
        }
    }

    // Admin functions to get all users and attendance data
    #[view]
    public fun get_all_attendance_by_date(date: String, caller: address): vector<AttendanceRecord> acquires AttendanceSystem {
        let attendance_system = borrow_global<AttendanceSystem>(@wenidi_addr);
        assert!(is_admin(caller, &attendance_system.users), E_NOT_AUTHORIZED);
        
        if (smart_table::contains(&attendance_system.attendance_records, date)) {
            *smart_table::borrow(&attendance_system.attendance_records, date)
        } else {
            vector::empty<AttendanceRecord>()
        }
    }
}