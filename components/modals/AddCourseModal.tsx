import React from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Course } from '@/types';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Course[];
  onAddCourse: (courseCode: string) => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen, onClose, searchQuery, setSearchQuery, searchResults, onAddCourse
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" /> เพิ่มวิชาเข้าหลักสูตร
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="ค้นหารหัสวิชา"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-2">
            {searchQuery.length > 0 && (
              <button
                onClick={() => onAddCourse(searchQuery.toUpperCase())}
                className="w-full text-left px-4 py-3 bg-blue-50/50 hover:bg-blue-50 rounded-xl flex items-center justify-between group border border-blue-100 transition-all mb-2"
              >
                <div>
                  <p className="font-bold text-blue-700">เพิ่มวิชา &quot;{searchQuery.toUpperCase()}&quot;</p>
                  <p className="text-blue-400 text-xs">เพิ่มรหัสวิชานี้ด้วยตัวเอง</p>
                </div>
                <Plus size={16} className="text-blue-600" />
              </button>
            )}

            {searchQuery.length >= 2 ? (
              searchResults.length > 0 ? (
                searchResults.map(course => (
                  <button
                    key={course.code}
                    onClick={() => onAddCourse(course.code)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-xl flex items-center justify-between group border border-transparent hover:border-blue-100 transition-all"
                  >
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{course.code}</p>
                      <p className="text-gray-400 text-xs">{course.name}</p>
                    </div>
                    <Plus size={16} className="text-blue-600 opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>ไม่พบรายวิชาในฐานข้อมูล</p>
                  <p className="text-[10px] mt-1">คุณสามารถกดปุ่มด้านบนเพื่อเพิ่มรหัสวิชาเองได้</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Search size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">พิมพ์รหัสวิชาเพื่อค้นหา หรือเพิ่มเอง</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
