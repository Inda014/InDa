import { motion } from "motion/react";
import { X, Mail, Phone, Calendar, Building, GraduationCap, Printer } from "lucide-react";
import { Student } from "../types";

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export default function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  if (!student) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in print:p-0">
      {/* Backdrop */}
      <motion.div
        id="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#080808]/40 print:hidden"
      />

      {/* Modal Container */}
      <motion.div
        id={`student-detail-profile-${student.student_id}`}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-[#0d0d0d] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full overflow-hidden z-10 print:shadow-none print:border-none print:bg-white print:text-black"
      >
        {/* Decorative Top Banner */}
        <div className="h-24 bg-gradient-to-r from-zinc-900 to-black border-b border-white/5 relative print:hidden">
          <button
            id="close-modal-upper-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/5 p-2 rounded-xl border border-transparent hover:border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 pb-6 pt-0 relative print:p-4">
          {/* Avatar Positioning overlapping with banner */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 mb-6 justify-center sm:justify-start">
            <div className="w-24 h-24 rounded-2xl border-4 border-[#0d0d0d] bg-[#0d0d0d] shadow-md overflow-hidden shrink-0 select-none print:border-slate-200">
              <img
                src={student.photo}
                alt={student.full_name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.full_name)}`;
                }}
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#c5a059]/10 text-[#c5a059] mb-1.5 border border-[#c5a059]/30">
                {student.class_level}
              </span>
              <h3 className="text-lg font-serif italic text-white md:text-xl leading-tight print:text-black">
                {student.full_name}
              </h3>
              <p className="text-[#c5a059] font-mono text-xs">
                ID: {student.student_id}
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 my-4 print:border-slate-200" />

          {/* Details Bento Fields */}
          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3 font-mono print:text-slate-400">
            Academic Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
              <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-lg shrink-0 print:bg-indigo-50 print:text-indigo-600">
                <Building className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider print:text-slate-400">Department</span>
                <span className="text-xs font-semibold text-white/90 block truncate print:text-slate-700">{student.department}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
              <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-lg shrink-0 print:bg-sky-50 print:text-sky-600">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider print:text-slate-400">Class/Level</span>
                <span className="text-xs font-semibold text-white/90 block print:text-slate-700">{student.class_level}</span>
              </div>
            </div>
          </div>

          <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-3 font-mono print:text-slate-400">
            Contact Channels
          </h4>
          <div className="space-y-2.5 mb-6">
            <div className="flex items-center gap-3 p-3 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
              <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-lg shrink-0 print:bg-slate-100 print:text-slate-600">
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider print:text-slate-400">Email Address</span>
                <a
                  href={`mailto:${student.email}`}
                  className="text-xs font-medium text-white/80 hover:text-[#c5a059] transition-colors block truncate print:text-indigo-600 print:underline"
                >
                  {student.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
              <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-lg shrink-0 print:bg-slate-100 print:text-slate-600">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider print:text-slate-400">Phone Number</span>
                <a
                  href={`tel:${student.phone_number}`}
                  className="text-xs font-medium text-white/80 hover:text-[#c5a059] transition-colors block print:text-slate-700"
                >
                  {student.phone_number}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/2 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
              <div className="p-2 bg-white/5 border border-white/10 text-[#c5a059] rounded-lg shrink-0 print:bg-slate-100 print:text-slate-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider print:text-slate-400 font-mono">Enrolled On</span>
                <span className="text-xs font-medium text-white/80 block print:text-slate-600">
                  {formatDate(student.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end print:hidden">
            <button
              id="print-profile-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-white/70 bg-white/5 hover:bg-white/10 hover:text-white text-xs font-medium rounded-full transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#c5a059]" />
              Print Record
            </button>
            <button
              id="close-modal-detail-btn"
              onClick={onClose}
              className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-[#080808] text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
