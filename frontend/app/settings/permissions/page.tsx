'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 💡 ขยายรายการสิทธิ์ทั้งหมดให้ครอบคลุมทุกโครงสร้างการทำงาน
const AVAILABLE_PERMISSIONS = [
  // ================= กลุ่มที่ 1: แดชบอร์ดและรายงาน =================
  { key: 'view_dashboard', label: '👁️ ดูหน้าแดชบอร์ดสรุปผล', group: 'ภาพรวมและรายงาน' },
  { key: 'export_excel', label: '📊 ส่งออกรายงาน Excel', group: 'ภาพรวมและรายงาน' },
  { key: 'export_pdf', label: '📕 ส่งออกรายงาน PDF', group: 'ภาพรวมและรายงาน' },

  // ================= กลุ่มที่ 2: จัดการครุภัณฑ์ =================
  { key: 'view_asset', label: '📋 ดูรายการครุภัณฑ์ทั้งหมด', group: 'จัดการครุภัณฑ์' },
  { key: 'create_asset', label: '➕ ขึ้นทะเบียนครุภัณฑ์ใหม่', group: 'จัดการครุภัณฑ์' },
  { key: 'edit_asset', label: '✏️ แก้ไขข้อมูลครุภัณฑ์', group: 'จัดการครุภัณฑ์' },
  { key: 'delete_asset', label: '🗑️ ลบข้อมูลครุภัณฑ์', group: 'จัดการครุภัณฑ์' },
  { key: 'import_asset', label: '📥 นำเข้าข้อมูลครุภัณฑ์ (Excel)', group: 'จัดการครุภัณฑ์' },
  { key: 'print_asset_form', label: '🖨️ พิมพ์เอกสาร สพ.4', group: 'จัดการครุภัณฑ์' },
  { key: 'manage_qr', label: '🏷️ พิมพ์สติ๊กเกอร์ QR Code', group: 'จัดการครุภัณฑ์' },

  // ================= กลุ่มที่ 3: ข้อมูลพื้นฐาน (Master Data) =================
  { key: 'manage_categories', label: '📁 จัดการหมวดหมู่ครุภัณฑ์', group: 'ข้อมูลพื้นฐาน' },
  { key: 'manage_locations', label: '🏢 จัดการสถานที่ตั้ง/แผนก', group: 'ข้อมูลพื้นฐาน' },
  { key: 'manage_vendors', label: '🤝 จัดการข้อมูลผู้ขาย', group: 'ข้อมูลพื้นฐาน' },

  // ================= กลุ่มที่ 4: ตั้งค่าระบบ =================
  { key: 'manage_org', label: '🏢 ตั้งค่าข้อมูลหน่วยงาน/องค์กร', group: 'ตั้งค่าระบบ' },
  { key: 'manage_running_number', label: '🔢 ตั้งค่ารูปแบบเลขรันอัตโนมัติ', group: 'ตั้งค่าระบบ' },
  
  // ================= กลุ่มที่ 5: ผู้ใช้งานและสิทธิ์ =================
  { key: 'manage_users', label: '👥 จัดการบัญชีผู้ใช้งาน', group: 'ผู้ใช้งานและสิทธิ์' },
  { key: 'manage_roles', label: '⚙️ ตั้งค่าสิทธิ์การใช้งาน (Permissions)', group: 'ผู้ใช้งานและสิทธิ์' },
];

export default function PermissionsSettings() {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://192.168.1.120:5000/api/roles/permissions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      alert('ไม่สามารถดึงข้อมูลสิทธิ์การใช้งานได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const togglePermission = (roleId: number, permissionKey: string) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === roleId) {
        const hasPerm = role.permissions.includes(permissionKey);
        const newPerms = hasPerm 
          ? role.permissions.filter((p: string) => p !== permissionKey)
          : [...role.permissions, permissionKey];
        
        return { ...role, permissions: newPerms };
      }
      return role;
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = roles.map(role => 
        fetch('http://192.168.1.120:5000/api/roles/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_id: role.id, permissions: role.permissions })
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        alert('✅ บันทึกสิทธิ์การใช้งานเรียบร้อยแล้ว!\n(ผู้ใช้งานอาจต้องเข้าสู่ระบบใหม่เพื่อให้สิทธิ์มีผล)');
        
        const currentRole = localStorage.getItem('roleName') || sessionStorage.getItem('roleName');
        const myRoleUpdated = roles.find(r => r.name === currentRole);
        if (myRoleUpdated) {
           localStorage.setItem('permissions', JSON.stringify(myRoleUpdated.permissions));
           sessionStorage.setItem('permissions', JSON.stringify(myRoleUpdated.permissions));
        }

      } else {
        alert('❌ เกิดข้อผิดพลาดในการบันทึกบางรายการ');
      }
    } catch (error) {
      alert('❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm hover:shadow-md hover:bg-gray-100 transition-all text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">สิทธิ์การใช้งาน (Permissions)</h1>
              <p className="text-gray-500 mt-1 text-sm">กำหนดขอบเขตการเข้าถึงและแก้ไขข้อมูลของแต่ละตำแหน่งในระบบอย่างละเอียด</p>
            </div>
          </div>
          <button onClick={handleSaveAll} disabled={isSaving} className="btn btn-primary px-10 text-white shadow-lg text-lg">
            {isSaving ? <span className="loading loading-spinner"></span> : '💾 บันทึกสิทธิ์ทั้งหมด'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-indigo-50 text-indigo-900 text-[15px]">
                <tr>
                  <th className="w-1/3 py-4 text-left pl-6 rounded-tl-2xl">ฟังก์ชันการทำงาน</th>
                  {roles.map(role => (
                    <th key={role.id} className="text-center py-4 border-l border-indigo-100 w-40">
                      <div className="font-bold">{role.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPermissions).map(([groupName, perms]) => (
                  <React.Fragment key={groupName}>
                    <tr className="bg-gray-100/50">
                      <td colSpan={roles.length + 1} className="font-bold text-indigo-800 py-3 pl-6 border-y border-gray-200 text-md">
                        {groupName}
                      </td>
                    </tr>
                    {perms.map((perm) => (
                      <tr key={perm.key} className="hover:bg-blue-50/30 border-b border-gray-100 last:border-0 transition-colors">
                        <td className="py-3.5 pl-10 text-gray-700">
                          {perm.label}
                        </td>
                        {roles.map(role => {
                          const isChecked = role.permissions.includes(perm.key);
                          
                          // 💡 ดักจับคำว่า Admin, Administrator หรือ ผู้ดูแลระบบ ไม่ให้แก้ไขได้และได้สิทธิ์ทั้งหมด
                          const roleNameLower = (role.name || '').toLowerCase();
                          const isAdmin = roleNameLower === 'admin' || 
                                          roleNameLower === 'administrator' || 
                                          role.name.includes('ผู้ดูแลระบบ');

                          return (
                            <td key={`${role.id}-${perm.key}`} className="text-center border-l border-gray-50">
                              <label className={`cursor-pointer inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input 
                                  type="checkbox" 
                                  className="checkbox checkbox-primary checkbox-sm rounded-md" 
                                  checked={isChecked || isAdmin} // บังคับติ๊กถูกเสมอถ้าเป็น Admin
                                  disabled={isAdmin} // ล็อกห้ามกดถ้าเป็น Admin
                                  onChange={() => togglePermission(role.id, perm.key)}
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 bg-yellow-50 text-yellow-700 p-4 rounded-xl border border-yellow-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          <span><strong>หมายเหตุ:</strong> ตำแหน่ง "กลุ่มผู้ดูแลระบบ (Administrator)" จะได้รับสิทธิ์สูงสุดในทุกฟังก์ชันโดยอัตโนมัติ และไม่สามารถปิดสิทธิ์ได้เพื่อป้องกันการถูกล็อกออกจากระบบ</span>
        </div>

      </div>
    </div>
  );
}