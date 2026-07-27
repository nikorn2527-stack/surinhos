'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // เพิ่ม State สำหรับ Remember Me
  const [error, setError] = useState('');

  // 💡 State สำหรับเก็บข้อมูลหน่วยงาน
  const [org, setOrg] = useState({ prefix: '', orgName: 'Pacific Plus IT', logo: '' });

  // 💡 ดึงข้อมูลหน่วยงานจาก API โดยตรงตอนโหลดหน้าเว็บ (แก้ปัญหาโลโก้หาย)
  useEffect(() => {
    fetch('http://localhost:5000/api/settings/organization')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setOrg(data);
        }
      })
      .catch(err => console.error('Error fetching org:', err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // เช็คว่าผู้ใช้ติ๊ก "จดจำการเข้าสู่ระบบ" หรือไม่
        const storage = rememberMe ? localStorage : sessionStorage;
        
        // บันทึกข้อมูลลงใน Storage ที่เลือก
        storage.setItem('token', data.token);
        storage.setItem('userName', data.user.name);
        storage.setItem('roleName', data.user.role_name);
        storage.setItem('permissions', JSON.stringify(data.user.permissions));
        
        router.push('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          
          {/* 💡 ส่วนหัวแสดงโลโก้และชื่อหน่วยงาน */}
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            {org.logo ? (
              <img 
                src={org.logo} 
                alt="Organization Logo" 
                className="w-24 h-24 object-contain shrink-0" 
              />
            ) : (
              <div className="w-24 h-24 bg-transparent text-primary flex items-center justify-center font-bold text-5xl shrink-0">
                {org.orgName ? org.orgName.charAt(0) : 'P'}
              </div>
            )}

            <div className="flex flex-col justify-center items-center w-full px-2">
              <h2 
                className="text-2xl font-bold text-primary leading-tight line-clamp-2" 
                title={`${org.prefix} ${org.orgName}`}
              >
                {org.prefix} {org.orgName}
              </h2>
              <p className="text-gray-500 mt-1 text-xl">ระบบบริหารจัดการครุภัณฑ์</p>
            </div>
          </div>

          {error && <div className="alert alert-error text-sm text-white py-2">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4 mt-2">
            <div className="form-control">
              <label className="label pb-1"><span className="label-text font-semibold">ชื่อผู้ใช้งาน</span></label>
              <input type="text" required className="input input-bordered w-full" 
                value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="form-control">
              <label className="label pb-1"><span className="label-text font-semibold">รหัสผ่าน</span></label>
              <input type="password" required className="input input-bordered w-full" 
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {/* Checkbox จดจำการเข้าสู่ระบบ */}
            <div className="form-control">
              <label className="cursor-pointer flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="label-text">จดจำการเข้าสู่ระบบ</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary w-full text-white mt-4 font-bold text-lg">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
    </div>
  );
}