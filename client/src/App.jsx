import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EnquiryForm from './pages/Public/EnquiryForm';
import Login from './pages/Admin/Login';
import ChangePassword from './pages/Admin/ChangePassword';
import EmailLogs from './pages/Admin/Master/EmailLogs';
import MasterManagementPage from './pages/Admin/Master/MasterManagementPage';
import UserMaster from './pages/Admin/Master/UserMaster';
import CourseFeesFix from './pages/Admin/Master/CourseFeesFix';
import AdminLayout from './components/layout/AdminLayout';
import ToastProvider from './components/layout/ToastProvider';
import ReportPrint from './pages/AO/ReportPrint';

// Role-based page folder structure imports
import AdminDashboard from './pages/Admin/Dashboard';
import AdminArchivedList from './pages/Admin/ArchivedList';
import ConsolidateReport from './pages/AO/ConsolidateReport';
import AODepartmentCount from './pages/AO/AODepartmentCount';
import AOCommunityReport from './pages/AO/AOCommunityReport';
import AOReferenceTypeReport from './pages/AO/AOReferenceTypeReport';
import AOReferenceWiseReport from './pages/AO/AOReferenceWiseReport';
import AOReferenceYearWiseReport from './pages/AO/AOReferenceYearWiseReport';
import AOMangCounsReport from './pages/AO/AOMangCounsReport';

import AdmissionProcess from './pages/Admission/AdmissionProcess';
import ToOfficeReport from './pages/Reports/ToOfficeReport';
import ToGateNoteReport from './pages/Reports/ToGateNoteReport';
import FeesAndOriginalsReport from './pages/Reports/FeesAndOriginalsReport';
import FeesAndOriginalsReportPG from './pages/Reports/FeesAndOriginalsReportPG';
import CertificateCountReport from './pages/Reports/CertificateCountReport';
import CertificateCountReportPG from './pages/Reports/CertificateCountReportPG';
import CertificateCountReportNPC from './pages/Reports/CertificateCountReportNPC';
import FeesAndOriginalsReportNPC from './pages/Reports/FeesAndOriginalsReportNPC';
import EnquiryDashboard from './pages/Enquiry/Dashboard';
import EnquiryArchivedList from './pages/Enquiry/ArchivedList';

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const role = (sessionStorage.getItem('role') || 'admin').toLowerCase().replace('_', ' ').replace('-', ' ');
  const hasAccess = allowedRoles.some(r => {
    const cleanAllowed = r.toLowerCase().replace('_', ' ').replace('-', ' ');
    return role.includes(cleanAllowed) || cleanAllowed.includes(role);
  });
  if (!hasAccess) {
    if (role.includes('admission')) {
      return <Navigate to="/admin/admission-entry" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

// Dynamic wrappers to match user's role with their dedicated folder page component
const DashboardWrapper = () => {
  const role = (sessionStorage.getItem('role') || 'admin').toLowerCase();
  if (role.includes('enquiry')) {
    return <EnquiryDashboard />;
  }
  return <AdminDashboard />;
};

const ArchivedListWrapper = () => {
  const role = (sessionStorage.getItem('role') || 'admin').toLowerCase();
  if (role.includes('enquiry')) {
    return <EnquiryArchivedList />;
  }
  return <AdminArchivedList />;
};

const AdminIndexRedirect = () => {
  const role = (sessionStorage.getItem('role') || 'admin').toLowerCase();
  if (role.includes('admission')) {
    return <Navigate to="admission-entry" replace />;
  }
  if (role === 'ao') {
    return <Navigate to="consolidate-report" replace />;
  }
  return <Navigate to="dashboard" replace />;
};

function App() {
  return (
    <Router>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<EnquiryForm />} />
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminIndexRedirect />} />
          <Route path="dashboard" element={
            <RoleRoute allowedRoles={['admin', 'enquiry_team']}>
              <DashboardWrapper />
            </RoleRoute>
          } />
          <Route path="archived" element={
            <RoleRoute allowedRoles={['admin', 'enquiry_team']}>
              <ArchivedListWrapper />
            </RoleRoute>
          } />
          <Route path="change-password" element={<ChangePassword />} />

          {/* Modules - Only for AO */}
          <Route path="admission-records" element={
            <RoleRoute allowedRoles={['ao']}>
              <AdmissionProcess defaultSection="entry" viewOnly={true} />
            </RoleRoute>
          } />
          
          <Route path="consolidate-report" element={
            <RoleRoute allowedRoles={['ao']}>
              <ConsolidateReport />
            </RoleRoute>
          } />
          <Route path="department-count" element={
            <RoleRoute allowedRoles={['ao']}>
              <AODepartmentCount />
            </RoleRoute>
          } />
          <Route path="mang-couns" element={
            <RoleRoute allowedRoles={['ao']}>
              <AOMangCounsReport />
            </RoleRoute>
          } />
          <Route path="reference-count" element={
            <RoleRoute allowedRoles={['ao']}>
              <AOReferenceWiseReport />
            </RoleRoute>
          } />
          <Route path="secretary-report/report-1" element={
            <RoleRoute allowedRoles={['ao']}>
              <AOReferenceTypeReport />
            </RoleRoute>
          } />
          <Route path="secretary-report/report-2" element={
            <RoleRoute allowedRoles={['ao']}>
              <AOCommunityReport />
            </RoleRoute>
          } />
          <Route path="secretary-report/report-3" element={
            <RoleRoute allowedRoles={['ao']}>
              <AOReferenceYearWiseReport />
            </RoleRoute>
          } />
          
          {/* Admission Process Routes */}
          <Route path="admission-entry" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <AdmissionProcess defaultSection="entry" />
            </RoleRoute>
          } />
          <Route path="staff-view" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <AdmissionProcess defaultSection="staff" />
            </RoleRoute>
          } />
          <Route path="certificate-entry" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <AdmissionProcess defaultSection="certificates" />
            </RoleRoute>
          } />
          <Route path="certificate-pg-entry" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <AdmissionProcess defaultSection="certificates-pg" />
            </RoleRoute>
          } />
          <Route path="certificate-npc-entry" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <AdmissionProcess defaultSection="certificates-npc" />
            </RoleRoute>
          } />
          <Route path="fees-entry" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <AdmissionProcess defaultSection="fees" />
            </RoleRoute>
          } />
          <Route path="concession-entry" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <AdmissionProcess defaultSection="concession" />
            </RoleRoute>
          } />

          {/* Reports Module Routes */}
          <Route path="reports/to-office" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <ToOfficeReport />
            </RoleRoute>
          } />
          <Route path="reports/to-gate-note" element={
            <RoleRoute allowedRoles={['admin', 'admission_team']}>
              <ToGateNoteReport />
            </RoleRoute>
          } />
          <Route path="reports/fees-originals" element={
            <RoleRoute allowedRoles={['admin', 'admission_team', 'ao']}>
              <FeesAndOriginalsReport />
            </RoleRoute>
          } />
          <Route path="reports/fees-originals-pg" element={
            <RoleRoute allowedRoles={['admin', 'admission_team', 'ao']}>
              <FeesAndOriginalsReportPG />
            </RoleRoute>
          } />
          <Route path="reports/certificate-count" element={
            <RoleRoute allowedRoles={['admin', 'admission_team', 'ao']}>
              <CertificateCountReport />
            </RoleRoute>
          } />
          <Route path="reports/certificate-count-pg" element={
            <RoleRoute allowedRoles={['admin', 'admission_team', 'ao']}>
              <CertificateCountReportPG />
            </RoleRoute>
          } />
          <Route path="reports/certificate-count-npc" element={
            <RoleRoute allowedRoles={['admin', 'admission_team', 'ao']}>
              <CertificateCountReportNPC />
            </RoleRoute>
          } />
          <Route path="reports/fees-originals-npc" element={
            <RoleRoute allowedRoles={['admin', 'admission_team', 'ao']}>
              <FeesAndOriginalsReportNPC />
            </RoleRoute>
          } />

          {/* Master Module Routes - Only for Admin */}
          <Route path="master/departments" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Department Master" 
                tableType="departments"
                columns={[
                  {key: 'institution', label: 'Institution'},
                  {key: 'department', label: 'Department'}, 
                  {key: 'type', label: 'Type'}
                ]}
                fields={[
                  {name: 'institution', label: 'Institution', type: 'select', optionsKey: 'institutions', required: true},
                  {name: 'department', label: 'Department Name', required: true},
                  {name: 'type', label: 'Type', type: 'select', options: ['UG', 'PG', 'DIPLOMA'], required: true}
                ]}
              />
            </RoleRoute>
          } />
          
          <Route path="master/studies" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Study Master" 
                tableType="studies"
                columns={[{key: 'study', label: 'Study'}]}
                fields={[{name: 'study', label: 'Study Level', required: true}]}
              />
            </RoleRoute>
          } />
          
          <Route path="master/communities" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Community Master" 
                tableType="communities"
                columns={[{key: 'community', label: 'Community'}]}
                fields={[{name: 'community', label: 'Community Name', required: true}]}
              />
            </RoleRoute>
          } />
          
          <Route path="master/admission-types" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Admission Type Master" 
                tableType="admission-types"
                columns={[{key: 'admission_type', label: 'Admission Type'}]}
                fields={[{name: 'admission_type', label: 'Admission Type', required: true}]}
              />
            </RoleRoute>
          } />
          
          <Route path="master/reference-types" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Reference Type Master" 
                tableType="reference-types"
                columns={[{key: 'reference_type', label: 'Reference Type'}, {key: 'way', label: 'Way'}]}
                fields={[
                  {name: 'reference_type', label: 'Reference Type', required: true},
                  {name: 'way', label: 'Way', type: 'select', options: ['Normal', 'Direct'], required: true}
                ]}
              />
            </RoleRoute>
          } />
          
          <Route path="master/admission-statuses" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Admission Status Master" 
                tableType="admission-statuses"
                columns={[{key: 'admission_status', label: 'Status'}]}
                fields={[{name: 'admission_status', label: 'Status Name', required: true}]}
              />
            </RoleRoute>
          } />
          
          <Route path="master/valid-date" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Valid Date Master" 
                tableType="valid-date"
                columns={[
                  {key: 'date_count', label: 'Days Limit'}, 
                  {key: 'archive_status', label: 'Archive Targets'},
                  {key: 'reference_way', label: 'Reference Way Targets'}
                ]}
                fields={[
                  {name: 'date_count', label: 'Days to Archive', type: 'number', required: true},
                  {name: 'archive_status', label: 'Statuses to Archive', type: 'checkbox-group', optionsKey: 'admissionStatuses', required: true},
                  {name: 'reference_way', label: 'Reference Ways to Archive', type: 'checkbox-group', options: ['Normal', 'Direct'], required: true}
                ]}
              />
            </RoleRoute>
          } />

          {/* New 10 Master Modules */}
          <Route path="master/districts" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="District Master" 
                tableType="districts"
                columns={[
                  {key: 'district_name', label: 'District Name'},
                  {key: 'state_name', label: 'State Name'}
                ]}
                fields={[
                  {name: 'district_name', label: 'District Name', required: true},
                  {name: 'state_name', label: 'State Name', required: true, defaultValue: 'TAMILNADU'}
                ]}
              />
            </RoleRoute>
          } />

          <Route path="master/schools" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="School Master" 
                tableType="schools"
                columns={[
                  {key: 'school_name', label: 'School Name'},
                  {key: 'city', label: 'City'},
                  {key: 'district_name', label: 'District'},
                  {key: 'state_name', label: 'State'}
                ]}
                fields={[
                  {name: 'school_name', label: 'School Name', required: true},
                  {name: 'city', label: 'City', required: true},
                  {name: 'district_name', label: 'District Name', required: true},
                  {name: 'state_name', label: 'State Name', required: true, defaultValue: 'TAMILNADU'}
                ]}
              />
            </RoleRoute>
          } />

          <Route path="master/consultancies" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Consultancy Master" 
                tableType="consultancies"
                columns={[
                  {key: 'consultancy_name', label: 'Consultancy Name'},
                  {key: 'consultancy_person_name', label: 'Contact Person'},
                  {key: 'consultancy_mobile', label: 'Mobile'},
                  {key: 'consultancy_city', label: 'City'}
                ]}
                fields={[
                  {name: 'consultancy_name', label: 'Consultancy Name', required: true},
                  {name: 'consultancy_person_name', label: 'Contact Person', required: true},
                  {name: 'consultancy_mobile', label: 'Mobile', required: true},
                  {name: 'consultancy_city', label: 'City', required: true}
                ]}
              />
            </RoleRoute>
          } />

          <Route path="master/staff" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Staff Master" 
                tableType="staff"
                columns={[
                  {key: 'staff_code', label: 'Staff Code'},
                  {key: 'staff_name', label: 'Staff Name'},
                  {key: 'staff_institution', label: 'Institution'},
                  {key: 'staff_department', label: 'Department'},
                  {key: 'staff_programme', label: 'Programme'},
                  {key: 'staff_programme_type', label: 'Programme Type'},
                  {key: 'staff_type', label: 'Type'},
                  {key: 'staff_phone', label: 'Phone'}
                ]}
                fields={[
                  {name: 'staff_code', label: 'Staff Code', required: true},
                  {name: 'staff_name', label: 'Staff Name', required: true},
                  {name: 'staff_institution', label: 'Institution', type: 'select', optionsKey: 'institutions'},
                  {name: 'staff_department', label: 'Department', type: 'select', optionsKey: 'departments', dependsOn: 'staff_institution'},
                  {name: 'staff_programme', label: 'Programme', type: 'auto-filled', autoFillFrom: 'staff_department', autoFillSource: 'program'},
                  {name: 'staff_programme_type', label: 'Programme Type', type: 'auto-filled', autoFillFrom: 'staff_department', autoFillSource: 'type'},
                  {name: 'staff_type', label: 'Type'},
                  {name: 'staff_email', label: 'Email'},
                  {name: 'staff_phone', label: 'Phone'},
                  {name: 'staff_address', label: 'Address'},
                  {name: 'individual_target', label: 'Individual Target', type: 'number', defaultValue: 0},
                  {name: 'password', label: 'Password'}
                ]}
              />
            </RoleRoute>
          } />

          <Route path="master/annual-income" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Annual Income Master" 
                tableType="annual-income"
                columns={[{key: 'income_name', label: 'Income Range'}]}
                fields={[{name: 'income_name', label: 'Income Range', required: true}]}
              />
            </RoleRoute>
          } />

          <Route path="master/religions" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Religion Master" 
                tableType="religions"
                columns={[{key: 'religion_name', label: 'Religion Name'}]}
                fields={[{name: 'religion_name', label: 'Religion Name', required: true}]}
              />
            </RoleRoute>
          } />

          <Route path="master/school-types" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="School Type Master" 
                tableType="school-types"
                columns={[{key: 'school_type_name', label: 'School Type Name'}]}
                fields={[{name: 'school_type_name', label: 'School Type Name', required: true}]}
              />
            </RoleRoute>
          } />

          <Route path="master/admission-years" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Admission Year Master" 
                tableType="admission-years"
                columns={[{key: 'admission_year_name', label: 'Admission Year Name'}]}
                fields={[{name: 'admission_year_name', label: 'Admission Year Name', required: true}]}
              />
            </RoleRoute>
          } />

          <Route path="master/groups-12th" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="12th Group Master" 
                tableType="groups-12th"
                columns={[{key: 'group_name', label: '12th Group Name'}]}
                fields={[{name: 'group_name', label: '12th Group Name', required: true}]}
              />
            </RoleRoute>
          } />

          <Route path="master/roles" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Role Master" 
                tableType="roles"
                columns={[{key: 'role_name', label: 'Role Name'}]}
                fields={[{name: 'role_name', label: 'Role Name', required: true}]}
              />
            </RoleRoute>
          } />

          <Route path="master/concessions" element={
            <RoleRoute allowedRoles={['admin']}>
              <MasterManagementPage 
                title="Concession Master" 
                tableType="concessions"
                columns={[{key: 'concession_type', label: 'Concession Type'}]}
                fields={[{name: 'concession_type', label: 'Concession Type', required: true}]}
              />
            </RoleRoute>
          } />

          <Route path="master/users" element={
            <RoleRoute allowedRoles={['admin']}>
              <UserMaster />
            </RoleRoute>
          } />

          <Route path="master/course-fees" element={
            <RoleRoute allowedRoles={['admin']}>
              <CourseFeesFix />
            </RoleRoute>
          } />

          <Route path="master/email-logs" element={
            <RoleRoute allowedRoles={['admin']}>
              <EmailLogs />
            </RoleRoute>
          } />

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        
        {/* Dedicated Print Route - Outside AdminLayout for clean print */}
        <Route path="/report-print/:id" element={
          <ProtectedRoute>
            <ReportPrint />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
