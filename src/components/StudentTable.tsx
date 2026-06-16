import { useState } from "react";
import { Eye, Edit2, Trash2, Mail, Phone, Calendar, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Student } from "../types";

interface StudentTableProps {
  students: Student[];
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student_id: string) => Promise<boolean>;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  onSort: (field: string) => void;
}

function SortIcon({ field, currentSortBy, currentSortOrder }: { field: string, currentSortBy: string, currentSortOrder: "ASC" | "DESC" }) {
  if (currentSortBy !== field) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-white/20 group-hover:text-[#c5a059] transition-colors" />;
  }
  return currentSortOrder === "ASC" 
    ? <ArrowUp className="w-3.5 h-3.5 text-[#c5a059]" /> 
    : <ArrowDown className="w-3.5 h-3.5 text-[#c5a059]" />;
}

export default function StudentTable({ 
  students, 
  onView, 
  onEdit, 
  onDelete,
  sortBy,
  sortOrder,
  onSort
}: StudentTableProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getDeptBadgeStyle = (dept: string) => {
    // Elegant dark gold/amber tones suited for Sophisticated Dark design
    return "bg-white/5 text-[#c5a059] border-[#c5a059]/30";
  };

  const getLevelBadgeStyle = (level: string) => {
    switch (level) {
      case "Freshman":
        return "bg-white/5 text-slate-300 border-white/10";
      case "Sophomore":
        return "bg-white/5 text-emerald-400 border-emerald-500/20";
      case "Junior":
        return "bg-white/5 text-sky-400 border-sky-500/20";
      case "Senior":
        return "bg-white/5 text-[#c5a059] border-[#c5a059]/30";
      default:
        return "bg-white/5 text-slate-300 border-white/10";
    }
  };

  const handleConfirmDelete = async (studentId: string) => {
    setIsDeleting(true);
    await onDelete(studentId);
    setDeleteConfirmId(null);
    setIsDeleting(false);
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-[#0d0d0d] rounded-2xl border border-white/10 shadow-md">
        <div className="w-16 h-16 bg-white/5 border border-white/10 text-[#c5a059] rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-[#c5a059] font-serif italic text-lg mb-1">No student records match filters</h3>
        <p className="text-white/40 text-xs max-w-sm mx-auto">
          Try adjusting your search criteria, selecting a different department / class level, or enroll a new student to start.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. Large Screen Tabular Layout (Hidden on Mobile) */}
      <div className="hidden lg:block w-full overflow-hidden bg-[#0d0d0d] rounded-2xl border border-white/10 shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 select-none">
              <th 
                onClick={() => onSort("full_name")}
                className="px-5 py-4 text-xs font-bold text-[#c5a059] uppercase tracking-widest font-serif italic cursor-pointer hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Student</span>
                  <SortIcon field="full_name" currentSortBy={sortBy} currentSortOrder={sortOrder} />
                </div>
              </th>
              <th 
                onClick={() => onSort("student_id")}
                className="px-5 py-4 text-xs font-bold text-[#c5a059] uppercase tracking-widest font-serif italic cursor-pointer hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Student ID</span>
                  <SortIcon field="student_id" currentSortBy={sortBy} currentSortOrder={sortOrder} />
                </div>
              </th>
              <th 
                onClick={() => onSort("department")}
                className="px-5 py-4 text-xs font-bold text-[#c5a059] uppercase tracking-widest font-serif italic cursor-pointer hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Department</span>
                  <SortIcon field="department" currentSortBy={sortBy} currentSortOrder={sortOrder} />
                </div>
              </th>
              <th 
                onClick={() => onSort("class_level")}
                className="px-5 py-4 text-xs font-bold text-[#c5a059] uppercase tracking-widest font-serif italic cursor-pointer hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Year/Level</span>
                  <SortIcon field="class_level" currentSortBy={sortBy} currentSortOrder={sortOrder} />
                </div>
              </th>
              <th className="px-5 py-4 text-xs font-bold text-[#c5a059] uppercase tracking-widest font-mono">Contact Details</th>
              <th className="px-5 py-4 text-xs font-bold text-[#c5a059] uppercase tracking-widest text-right font-serif italic">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {students.map((student) => {
              const isConfirming = deleteConfirmId === student.student_id;
              return (
                <tr
                  key={student.student_id}
                  id={`student-row-${student.student_id}`}
                  className="hover:bg-white/5 transition-colors"
                >
                  {/* Photo & Name */}
                  <td className="px-5 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 select-none bg-white/5 shrink-0">
                        <img
                          src={student.photo}
                          alt={student.full_name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.full_name)}`;
                          }}
                        />
                      </div>
                      <div>
                        <span className="block font-bold text-[#e0e0e0] text-sm hover:text-[#c5a059] transition-colors cursor-pointer" onClick={() => onView(student)}>
                          {student.full_name}
                        </span>
                        <span className="block text-[11px] text-white/45">
                          Enrolled: {student.created_at ? new Date(student.created_at).toLocaleDateString() : "Pending"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* ID */}
                  <td className="px-5 py-4.5">
                    <span className="font-mono text-xs font-semibold text-[#c5a059] bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      {student.student_id}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4.5">
                    <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${getDeptBadgeStyle(student.department)}`}>
                      {student.department}
                    </span>
                  </td>

                  {/* Class Level */}
                  <td className="px-5 py-4.5">
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getLevelBadgeStyle(student.class_level)}`}>
                      {student.class_level}
                    </span>
                  </td>

                  {/* Contact Channels */}
                  <td className="px-5 py-4.5 font-sans">
                    <div className="space-y-0.5">
                      <a
                        href={`mailto:${student.email}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-[#c5a059] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0 text-[#c5a059]" />
                        {student.email}
                      </a>
                      <a
                        href={`tel:${student.phone_number}`}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#c5a059] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0 text-white/30" />
                        {student.phone_number}
                      </a>
                    </div>
                  </td>

                  {/* Actions Column with Slide Deletion Confirm Inline */}
                  <td className="px-5 py-4.5 text-right whitespace-nowrap">
                    {isConfirming ? (
                      <div className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-500/20 py-1.5 px-3 rounded-xl">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-[11px] font-bold text-rose-400">Anonymize records?</span>
                        <button
                          id={`col-delete-confirm-${student.student_id}`}
                          onClick={() => handleConfirmDelete(student.student_id)}
                          disabled={isDeleting}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          id={`col-delete-cancel-${student.student_id}`}
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[10px] uppercase font-bold text-white/50 hover:text-white px-1 py-1 transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex gap-1.5">
                        <button
                          id={`action-view-${student.student_id}`}
                          onClick={() => onView(student)}
                          className="p-2 text-white/40 hover:text-[#c5a059] hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                          title="View Student details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`action-edit-${student.student_id}`}
                          onClick={() => onEdit(student)}
                          className="p-2 text-white/40 hover:text-[#c5a059] hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                          title="Edit Student profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`action-delete-${student.student_id}`}
                          onClick={() => setDeleteConfirmId(student.student_id)}
                          className="p-2 text-white/40 hover:text-rose-500 hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                          title="Delete student record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Responsive Mobile Card Collection Grid (Visible on small screens) */}
      <div className="block lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {students.map((student) => {
          const isConfirming = deleteConfirmId === student.student_id;
          return (
            <div
              key={student.student_id}
              id={`student-card-${student.student_id}`}
              className="bg-[#0d0d0d] rounded-2xl p-4.5 border border-white/10 shadow-md flex flex-col justify-between"
            >
              {/* Card Header Info */}
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                    <img
                      src={student.photo}
                      alt={student.full_name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.full_name)}`;
                      }}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <span
                      onClick={() => onView(student)}
                      className="block font-bold text-[#e0e0e0] text-sm hover:text-[#c5a059] truncate cursor-pointer font-serif italic"
                    >
                      {student.full_name}
                    </span>
                    <span className="inline-block font-mono text-[10px] font-bold text-[#c5a059] uppercase mt-0.5">
                      ID: {student.student_id}
                    </span>
                  </div>
                </div>

                {/* Badges Column */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getDeptBadgeStyle(student.department)}`}>
                    {student.department}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getLevelBadgeStyle(student.class_level)}`}>
                    {student.class_level}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 border-t border-white/5 pt-3 text-[12px] text-white/50 font-sans">
                  <a
                    href={`mailto:${student.email}`}
                    className="flex items-center gap-2 hover:text-[#c5a059] transition-colors overflow-hidden truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </a>
                  <a
                    href={`tel:${student.phone_number}`}
                    className="flex items-center gap-2 hover:text-[#c5a059] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-white/30" />
                    <span>{student.phone_number}</span>
                  </a>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
                {isConfirming ? (
                  <div className="flex items-center justify-between gap-1.5 bg-rose-950/40 border border-rose-500/20 p-1 rounded-xl w-full">
                    <span className="text-[10px] font-bold text-rose-400 pl-1.5">Delete?</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        id={`mob-delete-confirm-${student.student_id}`}
                        onClick={() => handleConfirmDelete(student.student_id)}
                        disabled={isDeleting}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase font-bold px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        id={`mob-delete-cancel-${student.student_id}`}
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-white/40 hover:text-white text-[10px] uppercase font-bold px-2 py-1.5 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-[10px] text-white/40 font-medium">
                      Enrolled: {student.created_at ? new Date(student.created_at).toLocaleDateString() : "Pending"}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        id={`mob-action-view-${student.student_id}`}
                        onClick={() => onView(student)}
                        className="p-1 px-2.5 text-white/60 hover:text-[#c5a059] hover:bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        id={`mob-action-edit-${student.student_id}`}
                        onClick={() => onEdit(student)}
                        className="p-1 px-2.5 text-white/60 hover:text-[#c5a059] hover:bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        id={`mob-action-delete-${student.student_id}`}
                        onClick={() => setDeleteConfirmId(student.student_id)}
                        className="p-1 px-2 text-white/40 hover:text-rose-500 hover:bg-rose-950/20 rounded-lg border border-white/10 transition-colors cursor-pointer text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
