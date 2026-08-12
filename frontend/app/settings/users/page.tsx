'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function UserManagement() {
  const router = useRouter();
  const { token, handleForceLogout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับ Modal ฟอร์ม
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role_id: 2
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (!token) return handleForceLogout('กรุณาเข้าสู่ระบบ');

      const headers = { 'Authorization': `Bearer ${token}` };

      const [usersRes, rolesRes] = await Promise.all([
        fetch('http://192.168.1.120:5000/api/users', { headers }).then(r => r.json()),
        fetch('http://192.168.1.120:5000/api/roles', { headers }).then(r => r.json())
      ]);

      if (usersRes?.forceLogout) return handleForceLogout(usersRes.error);

      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ username: '', password: '', name: '', role_id: roles.length > 0 ? roles[0].id : 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingId(user.id);
    setFormData({ 
      username: user.username, 
      password: '', // ปล่อยว่างไว้ ถ้าไม่กรอกแปลว่าไม่เปลี่ยนรหัส
      name: user.name, 
      role_id: user.role_id 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `http://192.168.1.120:5000/api/users/${editingId}` : 'http://192.168.1.120:5000/api/users';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert('✅ ' + data.message);
        setIsModalOpen(false);
        fetchData(); // โหลดข้อมูลใหม่
      } else {
        alert('❌ ' + data.error);
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน: ${name} ?`)) {
      try {
        const res = await fetch(`http://192.168.1.120:5000/api/users/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          alert('🗑️ ลบผู้ใช้งานสำเร็จ');
          fetchData();
        }
      } catch (err) {
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* หัวกระดาษ */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">จัดการผู้ใช้งาน</h1>
              <p className="text-gray-500 mt-1 text-sm">เพิ่ม ลบ และกำหนดสิทธิ์ผู้เข้าใช้งานระบบ</p>
            </div>
          </div>
          <button onClick={openAddModal} className="btn btn-primary text-white shadow-lg">
            ➕ เพิ่มผู้ใช้งานใหม่
          </button>
        </div>

        {/* ตารางแสดงผู้ใช้งาน */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200 text-gray-700 text-sm">
                <tr>
                  <th>ลำดับ</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ชื่อเข้าใช้ (Username)</th>
                  <th>ตำแหน่ง / สิทธิ์</th>
                  <th className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {/* 💡 ใส่ ? เพื่อป้องกัน error กรณีที่ users ยังไม่พร้อม */}
                {users?.map((user, index) => (
                  <tr key={user.id} className="hover">
                    <td>{index + 1}</td>
                    <td className="font-semibold text-gray-800">{user.name}</td>
                    <td>{user.username}</td>
                    <td>
                      <div className={`badge ${user.role_name === 'Admin' || user.role_name === 'ผู้ดูแลระบบ' ? 'badge-primary' : 'badge-neutral'} text-white`}>
                        {user.role_name}
                      </div>
                    </td>
                    <td className="text-center">
                      <button onClick={() => openEditModal(user)} className="btn btn-sm btn-warning text-white mr-2">✏️ แก้ไข</button>
                      <button onClick={() => handleDelete(user.id, user.name)} className="btn btn-sm btn-error text-white">🗑️ ลบ</button>
                    </td>
                  </tr>
                ))}
                {(!users || users.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">ยังไม่มีข้อมูลผู้ใช้งานในระบบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ================= Modal เพิ่ม/แก้ไข ผู้ใช้ ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-base-200 p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingId ? '✏️ แก้ไขผู้ใช้งาน' : '➕ เพิ่มผู้ใช้งานใหม่'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-bold">ชื่อ-นามสกุล</span></label>
                <input type="text" className="input input-bordered w-full bg-gray-50 focus:bg-white" required
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-bold">ชื่อผู้ใช้งาน (Username)</span></label>
                <input type="text" className="input input-bordered w-full bg-gray-50 focus:bg-white" required
                  value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  disabled={editingId !== null} // ไม่อนุญาตให้แก้ Username หากเป็นการแก้ไข
                  title={editingId ? "ไม่สามารถแก้ไข Username ได้" : ""}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">รหัสผ่าน (Password)</span>
                  {editingId && <span className="label-text-alt text-gray-400">ปล่อยว่างถ้าไม่เปลี่ยน</span>}
                </label>
                <input type="password" className="input input-bordered w-full bg-gray-50 focus:bg-white" 
                  required={!editingId} // ถ้าเพิ่มใหม่ บังคับกรอก, ถ้าแก้ไข ไม่บังคับ
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-bold">ตำแหน่ง / สิทธิ์ (Role)</span></label>
                <select className="select select-bordered w-full bg-gray-50 focus:bg-white" 
                  value={formData.role_id} onChange={(e) => setFormData({...formData, role_id: Number(e.target.value)})}
                >
                  {/* 💡 ใส่ ? ป้องกัน roles error */}
                  {roles?.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">ยกเลิก</button>
                <button type="submit" className="btn btn-primary px-8 text-white">💾 บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}