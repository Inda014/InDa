import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, Upload, Check, User, AlertCircle, Camera, Award, CreditCard } from "lucide-react";
import { Student } from "../types";

interface StudentFormProps {
  student: Student | null; // null if adding new
  onClose: () => void;
  onSave: (studentData: Student) => Promise<boolean>;
}

const DEPARTMENTS = [
  "Computer Science",
  "Data Science",
  "Bio-Medical Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Aerospace Engineering",
  "Information Technology",
  "Cyber Security",
  "Mathematics & Statistics",
  "Chemistry & Physics",
  "Philosophy & Humanities",
  "Business & Finance"
];

const CLASS_LEVELS = ["Freshman", "Sophomore", "Junior", "Senior"];

// Predefined modern avatar template colors for fast-avatar selection
const AVATAR_PALETTES = [
  { name: "Indigo Slate", bg: "#4F46E5" },
  { name: "Ocean Breeze", bg: "#0EA5E9" },
  { name: "Emerald Forest", bg: "#10B981" },
  { name: "Amber Sunset", bg: "#D97706" },
  { name: "Berry Velvet", bg: "#EC4899" },
  { name: "Purple Dream", bg: "#8B5CF6" },
  { name: "Crimson Eclipse", bg: "#EF4444" },
  { name: "Teal Lagoon", bg: "#14B8A6" },
];

export default function StudentForm({ student, onClose, onSave }: StudentFormProps) {
  const isEditMode = !!student;

  // Form State
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [classLevel, setClassLevel] = useState("Freshman");
  const [department, setDepartment] = useState("Computer Science");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photo, setPhoto] = useState("");

  // Avatar Selection State
  const [selectedPalette, setSelectedPalette] = useState(AVATAR_PALETTES[0].bg);
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(false);

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields on EditMode
  useEffect(() => {
    if (student) {
      setStudentId(student.student_id);
      setFullName(student.full_name);
      setClassLevel(student.class_level);
      setDepartment(student.department);
      setEmail(student.email);
      setPhoneNumber(student.phone_number);
      setPhoto(student.photo);
      setIsPhotoUploaded(student.photo.startsWith("data:image/jpeg") || student.photo.startsWith("data:image/png") || student.photo.startsWith("data:image/webp"));
    } else {
      // Create random ID prefix to help mock inputs
      const randomId = `STU-2026-${Math.floor(100 + Math.random() * 900)}`;
      setStudentId(randomId);
      // Pre-seed initials avatar color
      const randomPalette = AVATAR_PALETTES[Math.floor(Math.random() * AVATAR_PALETTES.length)].bg;
      setSelectedPalette(randomPalette);
    }
  }, [student]);

  // Handle dynamic SVG Initials Avatar representation
  useEffect(() => {
    if (!isPhotoUploaded && fullName.trim() !== "") {
      const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="100%" height="100%" fill="${selectedPalette}"/><text x="50%" y="54%" font-family="'Inter', sans-serif" font-weight="700" font-size="44" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
      setPhoto(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    } else if (!isPhotoUploaded && fullName.trim() === "") {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="100%" height="100%" fill="${selectedPalette}"/><text x="50%" y="54%" font-family="'Inter', sans-serif" font-weight="700" font-size="44" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">ST</text></svg>`;
      setPhoto(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    }
  }, [fullName, selectedPalette, isPhotoUploaded]);

  // Handle file uploading and conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: "File size exceeds 2MB limit." }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setIsPhotoUploaded(true);
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.photo;
          return copy;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, photo: "Drop file must be a valid image." }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: "File size exceeds 2MB limit." }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setIsPhotoUploaded(true);
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.photo;
          return copy;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUploadedPhoto = () => {
    setIsPhotoUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Perform client-side validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!studentId.trim()) {
      newErrors.studentId = "Student ID is required.";
    } else if (!/^[a-zA-Z0-9\-_]+$/.test(studentId)) {
      newErrors.studentId = "Alphanumeric, hyphens(-) and underscores(_) only.";
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = "Full Name must be at least 3 characters.";
    }

    if (!email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required.";
    } else if (phoneNumber.trim().length < 7) {
      newErrors.phoneNumber = "Phone Number must be at least 7 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const data: Student = {
      student_id: studentId.trim(),
      full_name: fullName.trim(),
      class_level: classLevel,
      department: department,
      email: email.trim(),
      phone_number: phoneNumber.trim(),
      photo: photo,
    };

    const success = await onSave(data);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        id="form-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Form Container */}
      <motion.div
        id="student-entry-form"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {isEditMode ? "Modify Student Record" : "Enroll New Student"}
            </h3>
            <p className="text-xs text-slate-400">
              {isEditMode ? "Update details for this student profile." : "Enter student academic credentials and contact channels."}
            </p>
          </div>
          <button
            id="close-form-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Visual Profile Photo / Avatar Column */}
            <div className="md:col-span-2 flex flex-col items-center">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start md:self-center">
                Student Profile Photo
              </span>
              
              {/* Main Avatar Preview Card */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group shrink-0 transition-colors hover:border-indigo-300"
              >
                {photo ? (
                  <>
                    <img
                      src={photo}
                      alt="Student Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover select-none"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <Camera className="text-white w-6 h-6 hover:scale-110 active:scale-95 transition-transform cursor-pointer" onClick={() => fileInputRef.current?.click()} />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium">Drag photo here</span>
                  </div>
                )}
              </div>

              {errors.photo && (
                <span className="text-rose-500 text-xs mt-1 text-center font-semibold">
                  {errors.photo}
                </span>
              )}

              {/* Avatar Generation & Switch Controls */}
              <div className="w-full mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    {isPhotoUploaded ? "File Uploaded" : "Auto Initials Palette"}
                  </span>
                  {isPhotoUploaded && (
                    <button
                      id="reset-avatar-generation-btn"
                      type="button"
                      onClick={clearUploadedPhoto}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Use Initials Style
                    </button>
                  )}
                </div>

                {!isPhotoUploaded ? (
                  // Palette Choice Grid for Instant Generated Avatars
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_PALETTES.map((color) => {
                      const active = selectedPalette === color.bg;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedPalette(color.bg)}
                          className="h-8 rounded-lg flex items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm relative overflow-hidden"
                          style={{ backgroundColor: color.bg, borderColor: active ? "#ffffff" : "transparent" }}
                        >
                          {active && (
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white font-bold" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> High-Resolution Photo Ready
                  </div>
                )}

                {/* Upload Trigger Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
                <button
                  id="browse-upload-file-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Custom Image
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Supports JPG, PNG or WebP. Max size: 2MB.
                </p>
              </div>
            </div>

            {/* Input fields grid */}
            <div className="md:col-span-3 space-y-4">
              
              {/* Student ID */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Student Registration ID <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-student-id"
                  type="text"
                  placeholder="e.g. STU-2026-001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={isEditMode}
                  className={`w-full px-4 py-2 text-sm font-medium border rounded-xl focus:outline-none transition-all ${
                    isEditMode
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : errors.studentId
                      ? "border-rose-300 focus:ring-2 focus:ring-rose-200"
                      : "border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  }`}
                />
                {isEditMode && (
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    Student identifier is immutable after verification.
                  </span>
                )}
                {errors.studentId && (
                  <span className="text-rose-500 text-xs mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.studentId}
                  </span>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-full-name"
                  type="text"
                  placeholder="e.g. Liam Sterling"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-2 text-sm font-semibold border rounded-xl focus:outline-none transition-all ${
                    errors.fullName
                      ? "border-rose-300 focus:ring-2 focus:ring-rose-200"
                      : "border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  }`}
                />
                {errors.fullName && (
                  <span className="text-rose-500 text-xs mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName}
                  </span>
                )}
              </div>

              {/* Grid 2x2 for Academic levels & Departments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Academic Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Class / level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="input-class-level"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white transition-all"
                  >
                    {CLASS_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faculty Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Faculty Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="input-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white transition-all"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Information (Email & Phone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 text-sm font-medium border rounded-xl focus:outline-none transition-all ${
                      errors.email
                        ? "border-rose-300 focus:ring-2 focus:ring-rose-200"
                        : "border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    }`}
                  />
                  {errors.email && (
                    <span className="text-rose-500 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.email}
                    </span>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-phone"
                    type="text"
                    placeholder="+1 (555) 019-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full px-4 py-2 text-sm font-medium border rounded-xl focus:outline-none transition-all ${
                      errors.phoneNumber
                        ? "border-rose-300 focus:ring-2 focus:ring-rose-200"
                        : "border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    }`}
                  />
                  {errors.phoneNumber && (
                    <span className="text-rose-500 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="border-t border-slate-100 pt-4 mt-6 flex gap-2 justify-end">
            <button
              id="cancel-form-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-student-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? "Save Changes" : "Validate & Enroll"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
