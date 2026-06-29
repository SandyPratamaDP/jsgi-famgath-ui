'use client';

import useSWR from 'swr';
import { fetchEmployees } from '../../../lib/api';

export default function EmployeesPage() {
  const { data, error, isLoading } = useSWR('employees', fetchEmployees, {
    refreshInterval: 10000,
  });

  const employees = data?.data ?? [];

  return (
    <main className="min-h-screen p-6 bg-base-200">
      <div className="max-w-6xl mx-auto">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h1 className="card-title">Master Employee Data</h1>
            <p>Responsive list of imported employees, transport type, bus PIC profile, and attendance.</p>
            <div className="overflow-x-auto mt-6">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>NIK</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Transport</th>
                    <th>Vehicles</th>
                    <th>PIC Bus</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8}>Loading…</td></tr>
                  ) : error ? (
                    <tr><td colSpan={8}>Failed to load employees.</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan={8}>No employee records found.</td></tr>
                  ) : (
                    employees.map((employee: any) => (
                      <tr key={employee.id}>
                        <td>{employee.nik}</td>
                        <td>{employee.name}</td>
                        <td>{employee.department}</td>
                        <td>{employee.employee_type}</td>
                        <td>{employee.transport_type}</td>
                        <td>{employee.total_vehicles}</td>
                        <td>{employee.is_pic_bus ? 'Yes' : 'No'}</td>
                        <td>{employee.attendance_status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
