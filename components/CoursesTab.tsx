'use client';
import { BookMarked, Search, Clock, MapPin, Calendar, Info, Plus, X, Save, Edit2, Trash2, AlertTriangle, FileUp } from 'lucide-react';
import { Course } from '@/types';
import { useState, useMemo, useRef } from 'react';

interface CoursesTabProps {
  courses: Course[];
  onCourseAdded?: () => void;
}

export const CoursesTab = ({ courses, onCourseAdded }: CoursesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // PDF Import State
  const [isUploading, setIsUploading] = useState(false);
  const [extractedCourses, setExtractedCourses] = useState<{code: string, name?: string, credit?: number, grade?: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Course>({
    code: '',
    name: '',
    credit: 3,
    day: 'จันทร์',
    time: '09:30 - 11:20',
    room: '',
    examDate: '',
    examTime: 'เช้า (09:30-12:00)'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(c => 
      c.code.toLowerCase().includes(query) || 
      c.name.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({
      code: '', name: '', credit: 3, day: 'จันทร์', time: '09:30 - 11:20',
      room: '', examDate: '', examTime: 'เช้า (09:30-12:00)'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setIsEditing(true);
    setFormData({ ...course });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (code: string) => {
    setCourseToDelete(code);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!formData.code || !formData.name) {
      alert('กรุณากรอกรหัสวิชาและชื่อวิชา');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save course');
      
      setIsModalOpen(false);
      if (onCourseAdded) onCourseAdded();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/courses?code=${courseToDelete}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete course');
      
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      if (onCourseAdded) onCourseAdded();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.courses) {
        setExtractedCourses(data.courses);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportExtracted = async () => {
    try {
      const res = await fetch('/api/degree-plan/completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: extractedCourses }),
      });
      if (!res.ok) throw new Error('Failed to import');
      
      alert(`นำเข้าสำเร็จ ${extractedCourses.length} รายวิชา!`);
      setExtractedCourses([]);
      if (onCourseAdded) onCourseAdded();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-1 text-gray-800 flex items-center gap-2">
            <BookMarked className="text-blue-600" size={24} /> รวมรายวิชา
          </h2>
          <p className="text-gray-500 text-sm">ค้นหาและดูรายละเอียดวิชาทั้งหมดในระบบ ({courses.length} วิชา)</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePdfUpload} 
            accept=".pdf" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-gray-200 disabled:opacity-50"
          >
            <FileUp size={18} /> {isUploading ? 'กำลังอ่าน...' : 'นำเข้าจาก PDF'}
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} /> เพิ่มวิชาใหม่
          </button>
        </div>
      </div>

      {extractedCourses.length > 0 && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Info size={18} /> พบรายวิชาจากไฟล์ PDF
            </h3>
            <button onClick={() => setExtractedCourses([])} className="text-blue-400 hover:text-blue-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {extractedCourses.map(course => (
              <div key={course.code} className="px-3 py-2 bg-white border border-blue-100 rounded-xl text-[11px] flex justify-between items-center group">
                <div className="min-w-0 flex-1">
                  <span className="font-black text-blue-700 block">{course.code}</span>
                  <span className="text-[9px] text-gray-400 truncate block">{course.name || 'ไม่ระบุชื่อ'}</span>
                </div>
                <span className="font-black text-green-600">{course.grade}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={handleImportExtracted}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            ยืนยันและบันทึกวิชาที่ผ่านแล้วทั้งหมด ({extractedCourses.length})
          </button>
        </div>
      )}

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={18} />
        </div>
        <input
          type="text"
          placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
          className="w-full pl-11 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <div key={course.code} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-blue-50 px-3 py-1 rounded-lg">
                  <span className="text-blue-700 font-black text-sm tracking-tight">{course.code}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEditModal(course)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="แก้ไขวิชา"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(course.code)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="ลบวิชา"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h4 className="font-bold text-gray-900 mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors pr-10">{course.name}</h4>
              
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-blue-500">
                    <Clock size={12} />
                  </div>
                  <span>{course.day || '-'} {course.time || ''}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-green-500">
                    <MapPin size={12} />
                  </div>
                  <span className="truncate">{course.room || '-'}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-orange-500">
                    <Calendar size={12} />
                  </div>
                  <span>{course.examDate || 'ไม่มีข้อมูลสอบ'}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-purple-500">
                    <Info size={12} />
                  </div>
                  <span>{course.examTime || '-'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <Search size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm font-medium">ไม่พบวิชาที่ค้นหา</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {isEditing ? <Edit2 size={18} className="text-blue-600" /> : <Plus size={18} className="text-blue-600" />}
                {isEditing ? 'แก้ไขข้อมูลวิชา' : 'เพิ่มวิชาใหม่เข้าระบบ'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">รหัสวิชา *</label>
                <input
                  type="text"
                  placeholder="เช่น RAM1000"
                  disabled={isEditing}
                  className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isEditing ? 'bg-gray-50 text-gray-500' : ''}`}
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อวิชา *</label>
                <input
                  type="text"
                  placeholder="เช่น ความรู้คู่คุณธรรม"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">หน่วยกิต</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.credit}
                  onChange={e => setFormData({ ...formData, credit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">วันเรียน</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  value={formData.day}
                  onChange={e => setFormData({ ...formData, day: e.target.value })}
                >
                  <option value="จันทร์">จันทร์</option>
                  <option value="อังคาร">อังคาร</option>
                  <option value="พุธ">พุธ</option>
                  <option value="พฤหัสบดี">พฤหัสบดี</option>
                  <option value="ศุกร์">ศุกร์</option>
                  <option value="เสาร์">เสาร์</option>
                  <option value="อาทิตย์">อาทิตย์</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">เวลาเรียน</label>
                <input
                  type="text"
                  placeholder="เช่น 09:30 - 11:20"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ห้องเรียน</label>
                <input
                  type="text"
                  placeholder="เช่น KTB 201"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.code.startsWith('e-') ? 'e-Testing (Online)' : formData.room}
                  onChange={e => setFormData({ ...formData, room: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">วันที่สอบ (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.examDate}
                  onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">เวลาสอบ</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  value={formData.examTime}
                  onChange={e => setFormData({ ...formData, examTime: e.target.value })}
                >
                  <option value="เช้า (09:30-12:00)">เช้า (09:30-12:00)</option>
                  <option value="บ่าย (14:00-16:30)">บ่าย (14:00-16:30)</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSaveCourse} 
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'กำลังบันทึก...' : <><Save size={16} /> {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มวิชา'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ยืนยันการลบวิชา?</h3>
              <p className="text-gray-500 text-sm mb-6">คุณแน่ใจหรือไม่ที่จะลบวิชา <span className="font-bold text-gray-800">{courseToDelete}</span>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleDeleteCourse}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังลบ...' : 'ลบเลย'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
