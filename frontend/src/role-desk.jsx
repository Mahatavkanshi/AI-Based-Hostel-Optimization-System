"use client";

import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api';

const deskSources = {
  ADMIN: {
    users: '/users',
    reference: '/users/reference-data',
    hostels: '/hostels',
  },
  WARDEN: {
    applications: '/hostel-management/applications',
    allocations: '/hostel-management/allocations',
    leaves: '/leaves',
    visitors: '/visitors/requests',
  },
  GATEKEEPER: {
    visitors: '/visitors/requests',
    entryLogs: '/visitors/entry-logs',
    leaves: '/leaves',
  },
  SUPERVISOR: {
    complaints: '/complaints',
    reference: '/complaints/reference-data',
  },
  ACCOUNTANT: {
    structures: '/fees/structures',
    invoices: '/fees/invoices',
    dashboard: '/fees/dashboard',
  },
  STUDENT: {
    applications: '/hostel-management/applications',
    fees: '/fees/invoices',
    leaves: '/leaves',
    visitors: '/visitors/requests',
    complaints: '/complaints',
    hostels: '/hostels',
  },
};

const emptyForms = {
  adminStudent: {
    fullName: '',
    email: '',
    phone: '',
    password: 'Student@123',
    rollNumber: '',
    registrationNumber: '',
    gender: 'MALE',
    department: 'Computer Science and Engineering',
    course: 'BTech',
    yearOfStudy: 3,
    semester: 6,
    guardianName: '',
    guardianPhone: '',
    address: '',
  },
  adminStaff: {
    fullName: '',
    email: '',
    phone: '',
    password: 'Staff@123',
    employeeId: '',
    gender: 'MALE',
    designation: '',
    joiningDate: '2026-04-01',
    assignedHostelId: '',
    roleCodes: 'WARDEN',
  },
  wardenApplication: { applicationId: '', status: 'APPROVED' },
  wardenAllocation: { applicationId: '', bedId: '', startDate: '2026-07-01' },
  wardenLeave: { leaveId: '', status: 'APPROVED' },
  wardenVisitor: { requestId: '', status: 'APPROVED' },
  gateCheckIn: { requestId: '', remarks: 'Verified at main gate' },
  gateCheckOut: { entryLogId: '', remarks: 'Visitor exited campus' },
  supervisorAssign: { complaintId: '', assignedToId: '' },
  supervisorUpdate: { complaintId: '', message: 'Maintenance completed', status: 'RESOLVED' },
  accountantStructure: {
    hostelId: '',
    academicYear: '2026-27',
    frequency: 'SEMESTER',
    category: 'HOSTEL_FEE',
    amount: 35000,
  },
  accountantInvoice: {
    studentId: '',
    feeStructureId: '',
    academicYear: '2026-27',
    billingSemester: 1,
    amount: 35000,
    dueDate: '2026-08-10',
  },
  studentApplication: { preferredHostelId: '', academicYear: '2026-27', reason: '' },
  studentLeave: { reason: '', fromDate: '2026-04-10', toDate: '2026-04-11' },
  studentVisitor: {
    visitDate: '2026-08-14T10:00:00.000Z',
    purpose: 'Family visit',
    visitorName: '',
    visitorPhone: '',
    relationToStudent: 'Father',
    idProofType: 'Aadhaar',
    idProofNumber: '',
  },
  studentComplaint: { title: '', description: '', category: 'ELECTRICAL', priority: 'HIGH' },
};

function summarizeStatusColor(status) {
  if (!status) return '';
  if (['APPROVED', 'ACTIVE', 'PAID', 'RESOLVED', 'RETURNED'].includes(status)) return 'good';
  if (['PENDING', 'PARTIAL', 'WAITLISTED', 'IN_PROGRESS'].includes(status)) return 'warn';
  if (['REJECTED', 'FAILED', 'CLOSED', 'EXPIRED', 'CANCELLED'].includes(status)) return 'bad';
  return '';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function SmallStat({ label, value, status }) {
  return (
    <div className={`desk-stat ${status || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataTable({ columns, rows, emptyText = 'No records found.' }) {
  if (!rows?.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => {
                const content = typeof column.render === 'function' ? column.render(row) : row[column.key];
                return <td key={column.key}>{content ?? '-'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelForm({ title, children, onSubmit, submitLabel }) {
  return (
    <form className="desk-form" onSubmit={onSubmit}>
      <div className="desk-card-head">
        <h3>{title}</h3>
      </div>
      <div className="desk-form-grid">{children}</div>
      <button className="primary-btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={onChange} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function RoleDesk({ primaryRole, token, user }) {
  const [deskData, setDeskData] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [forms, setForms] = useState(emptyForms);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  useEffect(() => {
    if (!primaryRole || !token) return;
    loadDesk();
  }, [primaryRole, token]);

  async function loadDesk() {
    const source = deskSources[primaryRole];
    if (!source) return;
    setLoading(true);
    setError('');

    try {
      const entries = await Promise.all(
        Object.entries(source).map(async ([key, path]) => {
          const payload = await apiRequest(path, { headers: { Authorization: `Bearer ${token}` } });
          return [key, payload.data];
        })
      );

      setDeskData(Object.fromEntries(entries));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAction(path, body, successMessage, resetKey) {
    setFeedback('');
    setError('');

    try {
      await apiRequest(path, {
        method: path.includes('/review') || path.includes('/assign') || path.includes('/updates') || path.includes('/check-out') ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      setFeedback(successMessage);
      if (resetKey) {
        setForms((current) => ({ ...current, [resetKey]: emptyForms[resetKey] }));
      }
      await loadDesk();
    } catch (err) {
      setError(err.message);
    }
  }

  function updateForm(key, field, value) {
    setForms((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
      },
    }));
  }

  const renderAdmin = () => {
    const hostels = deskData.reference?.hostels || [];
    const staffRoles = (deskData.reference?.roles || []).filter((role) => role.code !== 'STUDENT');

    return (
      <>
        <section className="desk-summary-grid">
          <SmallStat label="Users" value={deskData.users?.length || 0} />
          <SmallStat label="Hostels" value={deskData.hostels?.length || 0} />
          <SmallStat label="Role Options" value={deskData.reference?.roles?.length || 0} />
        </section>

        <section className="desk-grid two-up">
          <PanelForm
            title="Create Student"
            submitLabel="Create Student"
            onSubmit={(event) => {
              event.preventDefault();
              submitAction('/users/students', forms.adminStudent, 'Student account created.', 'adminStudent');
            }}
          >
            <Field label="Full Name" value={forms.adminStudent.fullName} onChange={(e) => updateForm('adminStudent', 'fullName', e.target.value)} />
            <Field label="Email" value={forms.adminStudent.email} onChange={(e) => updateForm('adminStudent', 'email', e.target.value)} />
            <Field label="Phone" value={forms.adminStudent.phone} onChange={(e) => updateForm('adminStudent', 'phone', e.target.value)} />
            <Field label="Roll Number" value={forms.adminStudent.rollNumber} onChange={(e) => updateForm('adminStudent', 'rollNumber', e.target.value)} />
            <Field label="Registration Number" value={forms.adminStudent.registrationNumber} onChange={(e) => updateForm('adminStudent', 'registrationNumber', e.target.value)} />
            <Field label="Guardian Name" value={forms.adminStudent.guardianName} onChange={(e) => updateForm('adminStudent', 'guardianName', e.target.value)} />
            <Field label="Guardian Phone" value={forms.adminStudent.guardianPhone} onChange={(e) => updateForm('adminStudent', 'guardianPhone', e.target.value)} />
            <Field label="Address" value={forms.adminStudent.address} onChange={(e) => updateForm('adminStudent', 'address', e.target.value)} />
          </PanelForm>

          <PanelForm
            title="Create Staff"
            submitLabel="Create Staff"
            onSubmit={(event) => {
              event.preventDefault();
              submitAction(
                '/users/staff',
                {
                  ...forms.adminStaff,
                  roleCodes: forms.adminStaff.roleCodes.split(',').map((item) => item.trim()).filter(Boolean),
                },
                'Staff account created.',
                'adminStaff'
              );
            }}
          >
            <Field label="Full Name" value={forms.adminStaff.fullName} onChange={(e) => updateForm('adminStaff', 'fullName', e.target.value)} />
            <Field label="Email" value={forms.adminStaff.email} onChange={(e) => updateForm('adminStaff', 'email', e.target.value)} />
            <Field label="Phone" value={forms.adminStaff.phone} onChange={(e) => updateForm('adminStaff', 'phone', e.target.value)} />
            <Field label="Employee ID" value={forms.adminStaff.employeeId} onChange={(e) => updateForm('adminStaff', 'employeeId', e.target.value)} />
            <Field label="Designation" value={forms.adminStaff.designation} onChange={(e) => updateForm('adminStaff', 'designation', e.target.value)} />
            <Field label="Role Codes" value={forms.adminStaff.roleCodes} onChange={(e) => updateForm('adminStaff', 'roleCodes', e.target.value)} placeholder={staffRoles.map((role) => role.code).join(', ')} />
            <SelectField
              label="Assigned Hostel"
              value={forms.adminStaff.assignedHostelId}
              onChange={(e) => updateForm('adminStaff', 'assignedHostelId', e.target.value)}
              options={[{ value: '', label: 'Select hostel' }, ...hostels.map((hostel) => ({ value: hostel.id, label: hostel.name }))]}
            />
          </PanelForm>
        </section>

        <section className="desk-card">
          <div className="desk-card-head"><h3>Recent Users</h3></div>
          <DataTable
            columns={[
              { key: 'fullName', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'roles', label: 'Roles', render: (row) => row.roles.join(', ') },
              { key: 'status', label: 'Status' },
            ]}
            rows={deskData.users || []}
          />
        </section>
      </>
    );
  };

  const renderWarden = () => (
    <>
      <section className="desk-summary-grid">
        <SmallStat label="Applications" value={deskData.applications?.length || 0} />
        <SmallStat label="Allocations" value={deskData.allocations?.length || 0} />
        <SmallStat label="Leaves" value={deskData.leaves?.length || 0} />
        <SmallStat label="Visitors" value={deskData.visitors?.length || 0} />
      </section>
      <section className="desk-grid two-up">
        <PanelForm title="Review Application" submitLabel="Update Application" onSubmit={(e) => { e.preventDefault(); submitAction(`/hostel-management/applications/${forms.wardenApplication.applicationId}/review`, { status: forms.wardenApplication.status }, 'Application status updated.', 'wardenApplication'); }}>
          <Field label="Application ID" value={forms.wardenApplication.applicationId} onChange={(e) => updateForm('wardenApplication', 'applicationId', e.target.value)} />
          <SelectField label="Status" value={forms.wardenApplication.status} onChange={(e) => updateForm('wardenApplication', 'status', e.target.value)} options={[{ value: 'APPROVED', label: 'APPROVED' }, { value: 'REJECTED', label: 'REJECTED' }, { value: 'WAITLISTED', label: 'WAITLISTED' }]} />
        </PanelForm>
        <PanelForm title="Create Allocation" submitLabel="Allocate Bed" onSubmit={(e) => { e.preventDefault(); submitAction('/hostel-management/allocations', forms.wardenAllocation, 'Bed allocated successfully.', 'wardenAllocation'); }}>
          <Field label="Application ID" value={forms.wardenAllocation.applicationId} onChange={(e) => updateForm('wardenAllocation', 'applicationId', e.target.value)} />
          <Field label="Bed ID" value={forms.wardenAllocation.bedId} onChange={(e) => updateForm('wardenAllocation', 'bedId', e.target.value)} />
          <Field label="Start Date" type="date" value={forms.wardenAllocation.startDate} onChange={(e) => updateForm('wardenAllocation', 'startDate', e.target.value)} />
        </PanelForm>
      </section>
      <section className="desk-card">
        <div className="desk-card-head"><h3>Hostel Applications</h3></div>
        <DataTable columns={[{ key: 'id', label: 'ID' }, { key: 'student', label: 'Student', render: (row) => row.student?.user?.fullName }, { key: 'academicYear', label: 'Year' }, { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${summarizeStatusColor(row.status)}`}>{row.status}</span> }]} rows={deskData.applications || []} />
      </section>
      <section className="desk-card">
        <div className="desk-card-head"><h3>Leave Requests</h3></div>
        <DataTable columns={[{ key: 'id', label: 'ID' }, { key: 'student', label: 'Student', render: (row) => row.student?.user?.fullName }, { key: 'fromDate', label: 'From', render: (row) => formatDate(row.fromDate) }, { key: 'toDate', label: 'To', render: (row) => formatDate(row.toDate) }, { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${summarizeStatusColor(row.status)}`}>{row.status}</span> }]} rows={deskData.leaves || []} />
      </section>
    </>
  );

  const renderGatekeeper = () => (
    <>
      <section className="desk-summary-grid">
        <SmallStat label="Visitor Requests" value={deskData.visitors?.length || 0} />
        <SmallStat label="Entry Logs" value={deskData.entryLogs?.length || 0} />
        <SmallStat label="Leave Verifications" value={deskData.leaves?.length || 0} />
      </section>
      <section className="desk-grid two-up">
        <PanelForm title="Visitor Check-In" submitLabel="Record Check-In" onSubmit={(e) => { e.preventDefault(); submitAction('/visitors/entry-logs/check-in', forms.gateCheckIn, 'Visitor check-in recorded.', 'gateCheckIn'); }}>
          <Field label="Request ID" value={forms.gateCheckIn.requestId} onChange={(e) => updateForm('gateCheckIn', 'requestId', e.target.value)} />
          <Field label="Remarks" value={forms.gateCheckIn.remarks} onChange={(e) => updateForm('gateCheckIn', 'remarks', e.target.value)} />
        </PanelForm>
        <PanelForm title="Visitor Check-Out" submitLabel="Record Check-Out" onSubmit={(e) => { e.preventDefault(); submitAction(`/visitors/entry-logs/${forms.gateCheckOut.entryLogId}/check-out`, { remarks: forms.gateCheckOut.remarks }, 'Visitor check-out recorded.', 'gateCheckOut'); }}>
          <Field label="Entry Log ID" value={forms.gateCheckOut.entryLogId} onChange={(e) => updateForm('gateCheckOut', 'entryLogId', e.target.value)} />
          <Field label="Remarks" value={forms.gateCheckOut.remarks} onChange={(e) => updateForm('gateCheckOut', 'remarks', e.target.value)} />
        </PanelForm>
      </section>
      <section className="desk-card">
        <div className="desk-card-head"><h3>Visitor Requests</h3></div>
        <DataTable columns={[{ key: 'id', label: 'ID' }, { key: 'visitor', label: 'Visitor', render: (row) => row.visitor?.fullName }, { key: 'student', label: 'Student', render: (row) => row.student?.user?.fullName }, { key: 'visitDate', label: 'Visit Date', render: (row) => formatDate(row.visitDate) }, { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${summarizeStatusColor(row.status)}`}>{row.status}</span> }]} rows={deskData.visitors || []} />
      </section>
    </>
  );

  const renderSupervisor = () => {
    const assignableStaff = deskData.reference?.staff || [];
    return (
      <>
        <section className="desk-summary-grid">
          <SmallStat label="Complaints" value={deskData.complaints?.length || 0} />
          <SmallStat label="Assignable Staff" value={assignableStaff.length || 0} />
        </section>
        <section className="desk-grid two-up">
          <PanelForm title="Assign Complaint" submitLabel="Assign" onSubmit={(e) => { e.preventDefault(); submitAction(`/complaints/${forms.supervisorAssign.complaintId}/assign`, { assignedToId: forms.supervisorAssign.assignedToId }, 'Complaint assigned.', 'supervisorAssign'); }}>
            <Field label="Complaint ID" value={forms.supervisorAssign.complaintId} onChange={(e) => updateForm('supervisorAssign', 'complaintId', e.target.value)} />
            <SelectField label="Assign To" value={forms.supervisorAssign.assignedToId} onChange={(e) => updateForm('supervisorAssign', 'assignedToId', e.target.value)} options={[{ value: '', label: 'Select staff' }, ...assignableStaff.map((staff) => ({ value: staff.id, label: `${staff.user.fullName} (${staff.employeeId})` }))]} />
          </PanelForm>
          <PanelForm title="Update Complaint" submitLabel="Save Update" onSubmit={(e) => { e.preventDefault(); submitAction(`/complaints/${forms.supervisorUpdate.complaintId}/updates`, { message: forms.supervisorUpdate.message, status: forms.supervisorUpdate.status }, 'Complaint updated.', 'supervisorUpdate'); }}>
            <Field label="Complaint ID" value={forms.supervisorUpdate.complaintId} onChange={(e) => updateForm('supervisorUpdate', 'complaintId', e.target.value)} />
            <Field label="Message" value={forms.supervisorUpdate.message} onChange={(e) => updateForm('supervisorUpdate', 'message', e.target.value)} />
            <SelectField label="Status" value={forms.supervisorUpdate.status} onChange={(e) => updateForm('supervisorUpdate', 'status', e.target.value)} options={[{ value: 'IN_PROGRESS', label: 'IN_PROGRESS' }, { value: 'RESOLVED', label: 'RESOLVED' }, { value: 'CLOSED', label: 'CLOSED' }]} />
          </PanelForm>
        </section>
        <section className="desk-card">
          <div className="desk-card-head"><h3>Complaints Board</h3></div>
          <DataTable columns={[{ key: 'id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'student', label: 'Student', render: (row) => row.student?.user?.fullName }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${summarizeStatusColor(row.status)}`}>{row.status}</span> }]} rows={deskData.complaints || []} />
        </section>
      </>
    );
  };

  const renderAccountant = () => (
    <>
      <section className="desk-summary-grid">
        <SmallStat label="Fee Structures" value={deskData.structures?.length || 0} />
        <SmallStat label="Invoices" value={deskData.invoices?.length || 0} />
        <SmallStat label="Pending" value={deskData.dashboard?.pendingCount || 0} status="warn" />
      </section>
      <section className="desk-grid two-up">
        <PanelForm title="Create Fee Structure" submitLabel="Create Structure" onSubmit={(e) => { e.preventDefault(); submitAction('/fees/structures', forms.accountantStructure, 'Fee structure created.', 'accountantStructure'); }}>
          <Field label="Hostel ID" value={forms.accountantStructure.hostelId} onChange={(e) => updateForm('accountantStructure', 'hostelId', e.target.value)} />
          <Field label="Academic Year" value={forms.accountantStructure.academicYear} onChange={(e) => updateForm('accountantStructure', 'academicYear', e.target.value)} />
          <SelectField label="Frequency" value={forms.accountantStructure.frequency} onChange={(e) => updateForm('accountantStructure', 'frequency', e.target.value)} options={[{ value: 'SEMESTER', label: 'SEMESTER' }, { value: 'MONTHLY', label: 'MONTHLY' }, { value: 'ONE_TIME', label: 'ONE_TIME' }]} />
          <SelectField label="Category" value={forms.accountantStructure.category} onChange={(e) => updateForm('accountantStructure', 'category', e.target.value)} options={[{ value: 'HOSTEL_FEE', label: 'HOSTEL_FEE' }, { value: 'SECURITY_DEPOSIT', label: 'SECURITY_DEPOSIT' }, { value: 'MAINTENANCE', label: 'MAINTENANCE' }, { value: 'FINE', label: 'FINE' }]} />
          <Field label="Amount" type="number" value={forms.accountantStructure.amount} onChange={(e) => updateForm('accountantStructure', 'amount', Number(e.target.value))} />
        </PanelForm>
        <PanelForm title="Generate Invoice" submitLabel="Generate Invoice" onSubmit={(e) => { e.preventDefault(); submitAction('/fees/invoices', forms.accountantInvoice, 'Invoice generated.', 'accountantInvoice'); }}>
          <Field label="Student Profile ID" value={forms.accountantInvoice.studentId} onChange={(e) => updateForm('accountantInvoice', 'studentId', e.target.value)} />
          <Field label="Fee Structure ID" value={forms.accountantInvoice.feeStructureId} onChange={(e) => updateForm('accountantInvoice', 'feeStructureId', e.target.value)} />
          <Field label="Academic Year" value={forms.accountantInvoice.academicYear} onChange={(e) => updateForm('accountantInvoice', 'academicYear', e.target.value)} />
          <Field label="Semester" type="number" value={forms.accountantInvoice.billingSemester} onChange={(e) => updateForm('accountantInvoice', 'billingSemester', Number(e.target.value))} />
          <Field label="Amount" type="number" value={forms.accountantInvoice.amount} onChange={(e) => updateForm('accountantInvoice', 'amount', Number(e.target.value))} />
          <Field label="Due Date" type="date" value={forms.accountantInvoice.dueDate} onChange={(e) => updateForm('accountantInvoice', 'dueDate', e.target.value)} />
        </PanelForm>
      </section>
      <section className="desk-card">
        <div className="desk-card-head"><h3>Invoices</h3></div>
        <DataTable columns={[{ key: 'invoiceNumber', label: 'Invoice' }, { key: 'student', label: 'Student', render: (row) => row.student?.user?.fullName }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${summarizeStatusColor(row.status)}`}>{row.status}</span> }, { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) }]} rows={deskData.invoices || []} />
      </section>
    </>
  );

  const renderStudent = () => {
    const hostels = deskData.hostels || [];
    return (
      <>
        <section className="desk-summary-grid">
          <SmallStat label="Applications" value={deskData.applications?.length || 0} />
          <SmallStat label="Leaves" value={deskData.leaves?.length || 0} />
          <SmallStat label="Visitors" value={deskData.visitors?.length || 0} />
          <SmallStat label="Complaints" value={deskData.complaints?.length || 0} />
        </section>
        <section className="desk-grid two-up">
          <PanelForm title="Hostel Application" submitLabel="Apply Hostel" onSubmit={(e) => { e.preventDefault(); submitAction('/hostel-management/applications', forms.studentApplication, 'Hostel application submitted.', 'studentApplication'); }}>
            <SelectField label="Preferred Hostel" value={forms.studentApplication.preferredHostelId} onChange={(e) => updateForm('studentApplication', 'preferredHostelId', e.target.value)} options={[{ value: '', label: 'Select hostel' }, ...hostels.map((hostel) => ({ value: hostel.id, label: hostel.name }))]} />
            <Field label="Academic Year" value={forms.studentApplication.academicYear} onChange={(e) => updateForm('studentApplication', 'academicYear', e.target.value)} />
            <Field label="Reason" value={forms.studentApplication.reason} onChange={(e) => updateForm('studentApplication', 'reason', e.target.value)} />
          </PanelForm>
          <PanelForm title="Leave Request" submitLabel="Submit Leave" onSubmit={(e) => { e.preventDefault(); submitAction('/leaves', forms.studentLeave, 'Leave request submitted.', 'studentLeave'); }}>
            <Field label="Reason" value={forms.studentLeave.reason} onChange={(e) => updateForm('studentLeave', 'reason', e.target.value)} />
            <Field label="From Date" type="date" value={forms.studentLeave.fromDate} onChange={(e) => updateForm('studentLeave', 'fromDate', e.target.value)} />
            <Field label="To Date" type="date" value={forms.studentLeave.toDate} onChange={(e) => updateForm('studentLeave', 'toDate', e.target.value)} />
          </PanelForm>
        </section>
        <section className="desk-grid two-up">
          <PanelForm title="Visitor Request" submitLabel="Create Visitor Request" onSubmit={(e) => { e.preventDefault(); submitAction('/visitors/requests', { visitDate: forms.studentVisitor.visitDate, purpose: forms.studentVisitor.purpose, visitor: { fullName: forms.studentVisitor.visitorName, phone: forms.studentVisitor.visitorPhone, relationToStudent: forms.studentVisitor.relationToStudent, idProofType: forms.studentVisitor.idProofType, idProofNumber: forms.studentVisitor.idProofNumber } }, 'Visitor request submitted.', 'studentVisitor'); }}>
            <Field label="Visitor Name" value={forms.studentVisitor.visitorName} onChange={(e) => updateForm('studentVisitor', 'visitorName', e.target.value)} />
            <Field label="Visitor Phone" value={forms.studentVisitor.visitorPhone} onChange={(e) => updateForm('studentVisitor', 'visitorPhone', e.target.value)} />
            <Field label="Visit Date" value={forms.studentVisitor.visitDate} onChange={(e) => updateForm('studentVisitor', 'visitDate', e.target.value)} />
            <Field label="Purpose" value={forms.studentVisitor.purpose} onChange={(e) => updateForm('studentVisitor', 'purpose', e.target.value)} />
            <Field label="Relation" value={forms.studentVisitor.relationToStudent} onChange={(e) => updateForm('studentVisitor', 'relationToStudent', e.target.value)} />
            <Field label="ID Proof Number" value={forms.studentVisitor.idProofNumber} onChange={(e) => updateForm('studentVisitor', 'idProofNumber', e.target.value)} />
          </PanelForm>
          <PanelForm title="Complaint" submitLabel="Raise Complaint" onSubmit={(e) => { e.preventDefault(); submitAction('/complaints', forms.studentComplaint, 'Complaint submitted.', 'studentComplaint'); }}>
            <Field label="Title" value={forms.studentComplaint.title} onChange={(e) => updateForm('studentComplaint', 'title', e.target.value)} />
            <Field label="Description" value={forms.studentComplaint.description} onChange={(e) => updateForm('studentComplaint', 'description', e.target.value)} />
            <SelectField label="Category" value={forms.studentComplaint.category} onChange={(e) => updateForm('studentComplaint', 'category', e.target.value)} options={[{ value: 'ELECTRICAL', label: 'ELECTRICAL' }, { value: 'PLUMBING', label: 'PLUMBING' }, { value: 'CLEANLINESS', label: 'CLEANLINESS' }, { value: 'MAINTENANCE', label: 'MAINTENANCE' }]} />
            <SelectField label="Priority" value={forms.studentComplaint.priority} onChange={(e) => updateForm('studentComplaint', 'priority', e.target.value)} options={[{ value: 'LOW', label: 'LOW' }, { value: 'MEDIUM', label: 'MEDIUM' }, { value: 'HIGH', label: 'HIGH' }, { value: 'URGENT', label: 'URGENT' }]} />
          </PanelForm>
        </section>
        <section className="desk-card">
          <div className="desk-card-head"><h3>My Invoices</h3></div>
          <DataTable columns={[{ key: 'invoiceNumber', label: 'Invoice' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status', render: (row) => <span className={`status-pill ${summarizeStatusColor(row.status)}`}>{row.status}</span> }, { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) }]} rows={deskData.fees || []} />
        </section>
      </>
    );
  };

  const roleTitle = `${primaryRole?.charAt(0)}${primaryRole?.slice(1).toLowerCase()} Desk`;

  const contentByRole = {
    ADMIN: renderAdmin,
    WARDEN: renderWarden,
    GATEKEEPER: renderGatekeeper,
    SUPERVISOR: renderSupervisor,
    ACCOUNTANT: renderAccountant,
    STUDENT: renderStudent,
  };

  const renderer = contentByRole[primaryRole];

  return (
    <section className="panel desk-shell">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">Role Workspace</p>
          <h2>{roleTitle}</h2>
        </div>
        <button className="secondary-btn" type="button" onClick={loadDesk}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="desk-note-strip">
        <span>Logged in as {user.fullName}</span>
        <small>Use these forms to test real workflows without editing raw JSON.</small>
      </div>

      <div className="desk-hero-card">
        <div>
          <p className="eyebrow">Operational Focus</p>
          <h3>{primaryRole} control panel</h3>
          <p>
            This desk shows live tables plus guided forms so you can demo each workflow clearly during viva
            and then customize the fields later.
          </p>
        </div>
        <div className="desk-hero-metrics">
          <div>
            <span>Role</span>
            <strong>{primaryRole}</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>Live API</strong>
          </div>
        </div>
      </div>

      {feedback ? <div className="feedback-banner success">{feedback}</div> : null}
      {error ? <div className="feedback-banner error">{error}</div> : null}

      {renderer ? renderer() : <div className="empty-state">No role desk is configured for this account.</div>}
    </section>
  );
}
