import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  GraduationCap, 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  RefreshCw, 
  BookOpen, 
  BarChart, 
  Clock,
  Briefcase,
  ShieldCheck,
  Sliders
} from "lucide-react";
import { Student, SystemNotification, StudentFilters } from "./types";
import StudentTable from "./components/StudentTable";
import StudentForm from "./components/StudentForm";
import StudentDetailModal from "./components/StudentDetailModal";
import NotificationToast from "./components/NotificationToast";
import IntegrityModal from "./components/IntegrityModal";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Primary Academic Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Stats Counters state
  const [stats, setStats] = useState({
    total: 0,
    departments: 0,
    seniors: 0,
    freshmen: 0
  });

  // Filters State
  const [filters, setFilters] = useState<StudentFilters>({
    search: "",
    classLevel: "all",
    department: "all"
  });

  // Available unique filter categories from database
  const [availableDepts, setAvailableDepts] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Modals & UI States
  const [selectedStudentForView, setSelectedStudentForView] = useState<Student | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIntegrityOpen, setIsIntegrityOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Sorting Table States
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Notifications Queue
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Toast dispatch helper
  const addNotification = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Update real-time clock in header
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch unique filters and build options
  const fetchFiltersSchema = useCallback(async () => {
    try {
      const response = await fetch("/api/filters");
      const data = await response.json();
      if (data.success) {
        setAvailableDepts(data.departments);
        setAvailableClasses(data.classes);
      }
    } catch (err) {
      console.error("Failed to query catalog filters", err);
    }
  }, []);

  // Primary data fetching coordinator
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: "10",
        search: filters.search,
        classLevel: filters.classLevel,
        department: filters.department,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/students?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
        setTotalCount(data.totalCount);
        setTotalPages(data.pagesCount);

        // Fetch overall stats summarizing full table bounds
        const statsResponse = await fetch("/api/students?limit=10000");
        const statsData = await statsResponse.json();
        if (statsData.success) {
          const allStus: Student[] = statsData.students;
          const depts = new Set(allStus.map(s => s.department));
          const seniors = allStus.filter(s => s.class_level === "Senior").length;
          const freshmen = allStus.filter(s => s.class_level === "Freshman").length;
          setStats({
            total: statsData.totalCount,
            departments: depts.size,
            seniors,
            freshmen
          });
        }
      } else {
        addNotification(data.error || "Failed to load students.", "error");
      }
    } catch (err) {
      addNotification("Could not connect to service endpoint.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, sortBy, sortOrder, addNotification]);

  // Handle Sort Click
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
    setCurrentPage(1);
  };

  // Synchronize dynamic lists and datatables on query change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchFiltersSchema();
  }, [fetchFiltersSchema]);

  // Reset filtering state
  const handleResetFilters = () => {
    setFilters({
      search: "",
      classLevel: "all",
      department: "all"
    });
    setCurrentPage(1);
    addNotification("Filters reset to catalog defaults.", "info");
  };

  // Create or Update student records handler
  const handleSaveStudent = async (studentData: Student): Promise<boolean> => {
    try {
      const isEdit = !!selectedStudentForEdit;
      const url = isEdit 
        ? `/api/students/${selectedStudentForEdit.student_id}` 
        : "/api/students";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();

      if (data.success) {
        addNotification(
          isEdit 
            ? `Successfully updated ${studentData.full_name}'s record.` 
            : `Successfully registered ${studentData.full_name} into system.`,
          "success"
        );
        fetchStudents();
        fetchFiltersSchema();
        return true;
      } else {
        addNotification(data.error || "Validation failure on submission.", "error");
        return false;
      }
    } catch (err) {
      addNotification("Network transmission error occurred.", "error");
      return false;
    }
  };

  // Delete student handler
  const handleDeleteStudent = async (studentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        addNotification(`Student record '${studentId}' was successfully anonymized.`, "success");
        // Reset to page 1 if current page contains no records after delete
        if (students.length === 1 && currentPage > 1) {
          setCurrentPage((prev) => Math.max(1, prev - 1));
        } else {
          fetchStudents();
        }
        fetchFiltersSchema();
        return true;
      } else {
        addNotification(data.error || "Unable to delete student record.", "error");
        return false;
      }
    } catch {
      addNotification("Network communication error during deletion.", "error");
      return false;
    }
  };

  // Perform dynamic CSV File fetching and triggering localized blob saves
  const handleExportCSV = async () => {
    try {
      addNotification("Preparing student registers...", "info");
      const response = await fetch("/api/export");
      if (!response.ok) throw new Error();
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = url;
      tempLink.setAttribute("download", `university_student_records_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(url);
      
      addNotification("CSV file successfully prepared and downloaded.", "success");
    } catch {
      addNotification("Failed to fetch database records as CSV file.", "error");
    }
  };

  // Form trigger helpers
  const handleOpenAddForm = () => {
    setSelectedStudentForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (student: Student) => {
    setSelectedStudentForEdit(student);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none print:bg-black print:text-white bg-[#080808] text-[#e0e0e0]">
      
      {/* 1. Global Navigation/Header bar */}
      <header className="sticky top-0 bg-[#0d0d0d] border-b border-white/5 z-40 px-4 sm:px-6 py-4 print:hidden shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[#c5a059] shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-serif italic text-[#c5a059] tracking-wide flex items-center gap-2">
                Academicus
                <span className="text-[10px] bg-white/5 text-[#c5a059] px-2 py-0.5 rounded-full border border-[#c5a059]/20 font-bold uppercase tracking-widest font-mono">
                  v2.2 (SQLite)
                </span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
                Administrative registry & directory dashboard
              </p>
            </div>
          </div>

          {/* Clock & Action buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-3.5">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl font-mono text-xs text-white/50">
              <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>{currentTime || "00:00:00"}</span>
            </div>
            <div className="flex gap-2">
              <button
                id="btn-admin-config"
                onClick={() => setIsAdminOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 border border-[#c5a059]/10 hover:border-[#c5a059]/40 hover:bg-[#c5a059]/5 rounded-full transition-all cursor-pointer"
                title="Open Administrative Options"
              >
                <Sliders className="w-3.5 h-3.5 text-[#c5a059]" />
                Admin Panel
              </button>
              <button
                id="btn-sync-integrity"
                onClick={() => setIsIntegrityOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 border border-[#c5a059]/20 hover:border-[#c5a059]/40 hover:bg-[#c5a059]/5 rounded-full transition-all cursor-pointer"
                title="Run Database Integrity Check"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" />
                Sync Integrity
              </button>
              <button
                id="btn-export-csv"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#c5a059]" />
                Export CSV
              </button>
              <button
                id="btn-enroll-student"
                onClick={handleOpenAddForm}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-[#c5a059] hover:bg-[#d4af37] text-[#080808] rounded-full transition-all shadow-[0_0_20px_rgba(197,160,89,0.15)] cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#080808]" />
                Enroll Student
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Analytics bento card row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          
          {/* KPI 1: Active Enrollment */}
          <div className="bg-[#0d0d0d] p-4.5 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 text-[#c5a059] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider">Total Enrolled</span>
              <span className="block text-2xl font-serif text-white tracking-tight">
                {isLoading ? "..." : stats.total}
              </span>
            </div>
          </div>

          {/* KPI 2: Departments Represented */}
          <div className="bg-[#0d0d0d] p-4.5 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 text-[#c5a059] rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider">Departments</span>
              <span className="block text-2xl font-serif text-white tracking-tight">
                {isLoading ? "..." : stats.departments}
              </span>
            </div>
          </div>

          {/* KPI 3: Senior Year Candidates */}
          <div className="bg-[#0d0d0d] p-4.5 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 text-[#c5a059] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider">Graduating Seniors</span>
              <span className="block text-2xl font-serif text-white tracking-tight">
                {isLoading ? "..." : stats.seniors}
              </span>
            </div>
          </div>

          {/* KPI 4: Freshmen Enrolled */}
          <div className="bg-[#0d0d0d] p-4.5 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 text-[#c5a059] rounded-xl">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider">Freshmen class</span>
              <span className="block text-2xl font-serif text-white tracking-tight">
                {isLoading ? "..." : stats.freshmen}
              </span>
            </div>
          </div>
        </section>

        {/* Search, filters, data visual table, pagination wrapper */}
        <section className="space-y-4">
          
          {/* Filters Bar and reset selectors */}
          <div className="bg-[#0d0d0d] p-4 rounded-2xl border border-white/10 shadow-md space-y-3.5 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left filter icons layout */}
              <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Directories & Filters</span>
                {(filters.search || filters.classLevel !== "all" || filters.department !== "all") && (
                  <button
                    id="link-reset-filters"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-[#c5a059] hover:text-[#d4af37] hover:underline cursor-pointer pl-2.5 border-l border-white/10"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Dynamic counters for matching items */}
              <div className="text-xs text-white/40 font-semibold md:text-right">
                Showing <span className="text-[#c5a059] font-bold">{students.length}</span> of <span className="text-[#c5a059] font-bold">{totalCount}</span> entries
              </div>
            </div>

            {/* Inputs controls grids */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Free-text Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="filter-search-input"
                  type="text"
                  placeholder="Search by name or registration ID..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9.5 pr-4 py-2.5 text-sm font-medium border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#c5a059] focus:border-[#c5a059] bg-white/5 text-white transition-all placeholder-white/20"
                />
              </div>

              {/* Faculty Department Filter */}
              <div>
                <select
                  id="filter-dept-select"
                  value={filters.department}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, department: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 text-sm font-semibold border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#c5a059] focus:border-[#c5a059] bg-[#0d0d0d] text-white transition-all cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {availableDepts.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#0d0d0d] text-white">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Level Year Filter */}
              <div>
                <select
                  id="filter-level-select"
                  value={filters.classLevel}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, classLevel: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 text-sm font-semibold border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#c5a059] focus:border-[#c5a059] bg-[#0d0d0d] text-white transition-all cursor-pointer"
                >
                  <option value="all">All Classes</option>
                  <option value="Freshman" className="bg-[#0d0d0d]">Freshman</option>
                  <option value="Sophomore" className="bg-[#0d0d0d]">Sophomore</option>
                  <option value="Junior" className="bg-[#0d0d0d]">Junior</option>
                  <option value="Senior" className="bg-[#0d0d0d]">Senior</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Loading Skeleton / Table contents display */}
          <div className="relative">
            {isLoading ? (
              <div className="bg-[#0d0d0d] rounded-2xl border border-white/10 p-8 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-white/5 rounded-full w-24 animate-pulse" />
                  <div className="h-5 bg-white/5 rounded-full w-40 animate-pulse" />
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 items-center border-b border-white/5 pb-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded-full w-2/5 animate-pulse" />
                        <div className="h-3 bg-white/5 rounded-full w-1/4 animate-pulse" />
                      </div>
                      <div className="h-6 bg-white/5 rounded-full w-16 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <StudentTable
                students={students}
                onView={(student) => setSelectedStudentForView(student)}
                onEdit={(student) => handleOpenEditForm(student)}
                onDelete={handleDeleteStudent}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            )}
          </div>

          {/* Pagination Controllers Bar */}
          {!isLoading && students.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 bg-[#0d0d0d] border border-white/5 rounded-2xl shadow-md gap-3 print:hidden">
              <span className="text-xs font-semibold text-white/40 text-center sm:text-left select-none">
                Showing Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
              </span>

              {/* Previous / Next and page indices mapping */}
              <div className="inline-flex gap-1.5 justify-center sm:justify-end items-center">
                <button
                  id="page-prev-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-[#c5a059]/40 hover:bg-white/5 rounded-xl font-sans text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-white/10 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Previous
                </button>

                {/* Statically display paginated page jumps */}
                {[...Array(totalPages)].map((_, index) => {
                  const num = index + 1;
                  const isActive = currentPage === num;
                  return (
                    <button
                      key={num}
                      id={`page-index-btn-${num}`}
                      onClick={() => setCurrentPage(num)}
                      className={`w-8.5 h-8.5 text-xs font-bold rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#c5a059] text-[#080808] border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.25)]"
                          : "bg-[#0d0d0d] border-white/10 hover:border-white/20 text-[#e0e0e0] hover:bg-white/5"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  id="page-next-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-[#c5a059]/40 hover:bg-white/5 rounded-xl font-sans text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:border-white/10 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 3. Global Footer copyright lines */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 py-6 text-center mt-12 print:hidden">
        <p className="text-xs text-white/30 uppercase tracking-[0.12em] font-medium">
          Academicus Student Registry &bull; Core Engine Secured by SQLite
        </p>
      </footer>

      {/* Toasts overlay portal */}
      <NotificationToast
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* Profile detail modal portal overlay */}
      {selectedStudentForView && (
        <StudentDetailModal
          student={selectedStudentForView}
          onClose={() => setSelectedStudentForView(null)}
        />
      )}

      {/* Creation and updates form overlays portal */}
      {isFormOpen && (
        <StudentForm
          student={selectedStudentForEdit}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedStudentForEdit(null);
          }}
          onSave={handleSaveStudent}
        />
      )}

      {/* Sync Integrity administrative scan overlays portal */}
      {isIntegrityOpen && (
        <IntegrityModal
          onClose={() => setIsIntegrityOpen(false)}
          onRefreshList={() => {
            fetchStudents();
            fetchFiltersSchema();
          }}
          addNotification={addNotification}
        />
      )}

      {/* Admin Panel administrative settings simulator portal */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
          onRefreshList={() => {
            fetchStudents();
            fetchFiltersSchema();
          }}
          addNotification={addNotification}
        />
      )}
    </div>
  );
}
