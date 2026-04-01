export const credentialPresets = [
  { role: 'ADMIN', email: '22040690@coer.ac.in', password: 'Admin@123', accent: 'terracotta' },
  { role: 'WARDEN', email: 'warden1@coer.ac.in', password: 'Warden@123', accent: 'sage' },
  { role: 'GATEKEEPER', email: 'gatekeeper1@coer.ac.in', password: 'Gate@123', accent: 'ink' },
  { role: 'SUPERVISOR', email: 'supervisor1@coer.ac.in', password: 'Supervisor@123', accent: 'gold' },
  { role: 'ACCOUNTANT', email: 'accountant1@coer.ac.in', password: 'Account@123', accent: 'mint' },
  { role: 'STUDENT', email: 'student1@coer.ac.in', password: 'Student@123', accent: 'plum' },
];

export const actionLibrary = {
  common: [
    {
      label: 'My Profile',
      method: 'GET',
      path: '/auth/me',
      body: null,
      notes: 'Shows the logged-in user profile and assigned roles.',
    },
  ],
  ADMIN: [
    {
      label: 'List Users',
      method: 'GET',
      path: '/users',
      body: null,
      notes: 'See all created users in the system.',
    },
    {
      label: 'Reference Data',
      method: 'GET',
      path: '/users/reference-data',
      body: null,
      notes: 'Fetch hostels and roles before creating staff and students.',
    },
    {
      label: 'Create Student',
      method: 'POST',
      path: '/users/students',
      body: {
        fullName: 'New Student',
        email: 'new.student@coer.ac.in',
        phone: '9100000101',
        password: 'Student@123',
        rollNumber: 'CSE2026-201',
        registrationNumber: 'REG2026-201',
        gender: 'MALE',
        department: 'Computer Science and Engineering',
        course: 'BTech',
        yearOfStudy: 3,
        semester: 6,
        guardianName: 'Guardian Name',
        guardianPhone: '9100000102',
        address: 'Roorkee, Uttarakhand',
      },
      notes: 'Edit email, roll number, and phone before sending again.',
    },
    {
      label: 'Create Warden',
      method: 'POST',
      path: '/users/staff',
      body: {
        fullName: 'New Warden',
        email: 'new.warden@coer.ac.in',
        phone: '9100000103',
        password: 'Warden@123',
        employeeId: 'EMP-WARDEN-201',
        gender: 'FEMALE',
        designation: 'Hostel Warden',
        joiningDate: '2026-04-01',
        assignedHostelId: 'REPLACE_WITH_HOSTEL_ID',
        roleCodes: ['WARDEN'],
      },
      notes: 'Get the hostel id from Reference Data and replace it before submit.',
    },
    {
      label: 'Create Hostel',
      method: 'POST',
      path: '/hostels',
      body: {
        campusId: 'REPLACE_WITH_CAMPUS_ID',
        name: 'Boys Hostel 2',
        code: 'BH-02',
        type: 'BOYS',
        capacity: 300,
        address: 'West residential zone',
      },
      notes: 'Use GET /hostels/campuses first for the campus id.',
    },
  ],
  WARDEN: [
    {
      label: 'Review Application',
      method: 'PATCH',
      path: '/hostel-management/applications/REPLACE_WITH_APPLICATION_ID/review',
      body: { status: 'APPROVED' },
      notes: 'Choose APPROVED, REJECTED, or WAITLISTED.',
    },
    {
      label: 'Create Allocation',
      method: 'POST',
      path: '/hostel-management/allocations',
      body: {
        applicationId: 'REPLACE_WITH_APPLICATION_ID',
        bedId: 'REPLACE_WITH_BED_ID',
        startDate: '2026-07-01',
      },
      notes: 'Allocate a bed only after the application is approved.',
    },
    {
      label: 'Review Leave',
      method: 'PATCH',
      path: '/leaves/REPLACE_WITH_LEAVE_ID/review',
      body: { status: 'APPROVED' },
      notes: 'Use APPROVED, REJECTED, or RETURNED.',
    },
    {
      label: 'Review Visitor',
      method: 'PATCH',
      path: '/visitors/requests/REPLACE_WITH_REQUEST_ID/review',
      body: { status: 'APPROVED' },
      notes: 'Approve or reject visitor requests.',
    },
  ],
  GATEKEEPER: [
    {
      label: 'Visitor Check-In',
      method: 'POST',
      path: '/visitors/entry-logs/check-in',
      body: { requestId: 'REPLACE_WITH_REQUEST_ID', remarks: 'Verified at main gate' },
      notes: 'Record visitor arrival after approval.',
    },
    {
      label: 'Visitor Check-Out',
      method: 'PATCH',
      path: '/visitors/entry-logs/REPLACE_WITH_ENTRY_LOG_ID/check-out',
      body: { remarks: 'Visitor exited campus' },
      notes: 'Complete visitor exit record.',
    },
  ],
  SUPERVISOR: [
    {
      label: 'Assign Complaint',
      method: 'PATCH',
      path: '/complaints/REPLACE_WITH_COMPLAINT_ID/assign',
      body: { assignedToId: 'REPLACE_WITH_STAFF_PROFILE_ID' },
      notes: 'Assign a complaint to a staff member.',
    },
    {
      label: 'Update Complaint',
      method: 'PATCH',
      path: '/complaints/REPLACE_WITH_COMPLAINT_ID/updates',
      body: { message: 'Maintenance work completed successfully.', status: 'RESOLVED' },
      notes: 'Move a complaint toward RESOLVED or CLOSED.',
    },
  ],
  ACCOUNTANT: [
    {
      label: 'Create Fee Structure',
      method: 'POST',
      path: '/fees/structures',
      body: {
        hostelId: 'REPLACE_WITH_HOSTEL_ID',
        academicYear: '2026-27',
        frequency: 'SEMESTER',
        category: 'HOSTEL_FEE',
        amount: 35000,
      },
      notes: 'Create hostel fee or deposit structure.',
    },
    {
      label: 'Generate Invoice',
      method: 'POST',
      path: '/fees/invoices',
      body: {
        studentId: 'REPLACE_WITH_STUDENT_PROFILE_ID',
        feeStructureId: 'REPLACE_WITH_FEE_STRUCTURE_ID',
        academicYear: '2026-27',
        billingSemester: 1,
        amount: 35000,
        dueDate: '2026-08-10',
      },
      notes: 'Generate an invoice for a student.',
    },
  ],
  STUDENT: [
    {
      label: 'Apply Hostel',
      method: 'POST',
      path: '/hostel-management/applications',
      body: {
        preferredHostelId: 'REPLACE_WITH_HOSTEL_ID',
        academicYear: '2026-27',
        reason: 'Need accommodation near department block',
      },
      notes: 'Submit hostel application from student account.',
    },
    {
      label: 'Create Leave',
      method: 'POST',
      path: '/leaves',
      body: { reason: 'Going home for weekend', fromDate: '2026-04-06', toDate: '2026-04-07' },
      notes: 'Submit a leave request to the warden.',
    },
    {
      label: 'Create Visitor',
      method: 'POST',
      path: '/visitors/requests',
      body: {
        visitDate: '2026-08-14T10:00:00.000Z',
        purpose: 'Family visit',
        visitor: {
          fullName: 'Suresh Kumar',
          phone: '9876543211',
          idProofType: 'Aadhaar',
          idProofNumber: '1234-5678-9000',
          relationToStudent: 'Father',
        },
      },
      notes: 'Create a visitor approval request.',
    },
    {
      label: 'Create Complaint',
      method: 'POST',
      path: '/complaints',
      body: {
        title: 'Fan not working',
        description: 'The fan in room 201 is not working properly.',
        category: 'ELECTRICAL',
        priority: 'HIGH',
      },
      notes: 'Raise a maintenance complaint.',
    },
  ],
};

export const resourceLibrary = {
  common: [
    { label: 'Profile Snapshot', path: '/auth/me', metric: 'roles', note: 'Identity and role details for the active account.' },
  ],
  ADMIN: [
    { label: 'Users', path: '/users', metric: 'count', note: 'All created users in the system.' },
    { label: 'Hostels', path: '/hostels', metric: 'count', note: 'Master hostel hierarchy and occupancy map.' },
    { label: 'Fee Dashboard', path: '/fees/dashboard', metric: 'object', note: 'Collections and invoice summary.' },
  ],
  WARDEN: [
    { label: 'Applications', path: '/hostel-management/applications', metric: 'count', note: 'Student accommodation requests pending review.' },
    { label: 'Allocations', path: '/hostel-management/allocations', metric: 'count', note: 'All current and completed allocations.' },
    { label: 'Leaves', path: '/leaves', metric: 'count', note: 'Leave requests waiting for approval.' },
    { label: 'Visitors', path: '/visitors/requests', metric: 'count', note: 'Visitor requests and approval status.' },
  ],
  GATEKEEPER: [
    { label: 'Visitor Requests', path: '/visitors/requests', metric: 'count', note: 'Approved requests used at the gate.' },
    { label: 'Entry Logs', path: '/visitors/entry-logs', metric: 'count', note: 'In and out records for visitor movement.' },
    { label: 'Leaves', path: '/leaves', metric: 'count', note: 'Student movement verification list.' },
  ],
  SUPERVISOR: [
    { label: 'Complaints', path: '/complaints', metric: 'count', note: 'Operational complaints requiring maintenance follow-up.' },
    { label: 'Complaint Reference', path: '/complaints/reference-data', metric: 'object', note: 'Assignable staff and complaint presets.' },
  ],
  ACCOUNTANT: [
    { label: 'Fee Structures', path: '/fees/structures', metric: 'count', note: 'Current charge definitions used for billing.' },
    { label: 'Invoices', path: '/fees/invoices', metric: 'count', note: 'Invoice list with payment status.' },
    { label: 'Fee Dashboard', path: '/fees/dashboard', metric: 'object', note: 'Collection summary for the term.' },
  ],
  STUDENT: [
    { label: 'My Applications', path: '/hostel-management/applications', metric: 'count', note: 'Track hostel application progress.' },
    { label: 'My Fees', path: '/fees/invoices', metric: 'count', note: 'Pending and paid fee invoices.' },
    { label: 'My Leaves', path: '/leaves', metric: 'count', note: 'Leave request history and approval status.' },
    { label: 'My Complaints', path: '/complaints', metric: 'count', note: 'Track complaints raised from the hostel room.' },
  ],
};

export const workspaceTabs = [
  { id: 'desk', label: 'Role Desk' },
  { id: 'overview', label: 'Overview' },
  { id: 'explorer', label: 'Data Explorer' },
  { id: 'studio', label: 'Action Studio' },
  { id: 'credentials', label: 'Role Logins' },
];
