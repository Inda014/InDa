import { useState, useEffect } from "react";
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  AlertOctagon, 
  Mail, 
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2
} from "lucide-react";
import { Student } from "../types";

interface DuplicateGroup {
  email: string;
  count: number;
  students: {
    student_id: string;
    full_name: string;
    email: string;
    department: string;
  }[];
}

interface IntegrityData {
  duplicates: DuplicateGroup[];
  incomplete: Student[];
  formatIssues: {
    student_id: string;
    full_name: string;
    email: string;
  }[];
  integrityScore: number;
  totalIssues: number;
}

interface IntegrityModalProps {
  onClose: () => void;
  onRefreshList: () => void;
  addNotification: (message: string, type: "success" | "error" | "info") => void;
}

export default function IntegrityModal({ onClose, onRefreshList, addNotification }: IntegrityModalProps) {
  const [data, setData] = useState<IntegrityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);

  const fetchIntegrity = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrity");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        addNotification("Failed to fetch integrity checks.", "error");
      }
    } catch {
      addNotification("Could not connect to integrity checking service.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrity();
  }, []);

  const handleAdminReseed = async () => {
    if (!window.confirm("WARNING: This administrative operation will DROP the student table and restore the clean 12-records database. Are you sure?")) {
      return;
    }
    setReseedLoading(true);
    try {
      const res = await fetch("/api/reseed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        addNotification(json.message, "success");
        fetchIntegrity();
        onRefreshList();
      } else {
        addNotification(json.error || "Reset failed.", "error");
      }
    } catch {
      addNotification("Error invoking seeding administrator.", "error");
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        id="integrity-modal-container"
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white sm:p-1"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/5 border border-[#c5a059]/20 rounded-lg text-[#c5a059]">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-serif italic text-[#c5a059] tracking-wide">
                Database Sync & Integrity Checks
              </h2>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                Administrative diagnostic reporting
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details and Metrics Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#c5a059] animate-spin" />
              <span className="text-xs uppercase tracking-widest text-[#c5a059]">Running diagnostic check...</span>
            </div>
          ) : data ? (
            <>
              {/* Score Display Card */}
              <div className="bg-[#080808] border border-white/5 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-5">
                <div>
                  <h3 className="text-white font-serif italic text-lg mb-0.5">Integrity Rating</h3>
                  <p className="text-xs text-white/45 max-w-md">
                    Estimates general correctness of student identifiers, duplicate emails matching rules, and complete contact cards.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="block font-mono text-3xl font-extrabold text-[#c5a059]">
                      {data.integrityScore}%
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-white/40 font-bold">
                      {data.totalIssues === 0 ? "Perfect State" : `${data.totalIssues} active alert(s)`}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-full border ${data.integrityScore >= 90 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-500"}`}>
                    {data.integrityScore >= 90 ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                </div>
              </div>

              {/* Sections: Duplicates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-widest text-[#c5a059] font-bold">
                    Duplicate Email Duplications ({data.duplicates.length})
                  </h4>
                  <HelpCircle className="w-3.5 h-3.5 text-white/20" title="Each email must belongs to exactly 1 student record" />
                </div>
                {data.duplicates.length === 0 ? (
                  <div className="bg-white/2 p-3.5 border border-white/5 rounded-xl text-center text-xs text-white/30">
                    No duplicate emails detected. All registered emails are distinct.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {data.duplicates.map((dup, i) => (
                      <div key={i} className="p-3.5 bg-rose-950/20 border border-rose-500/10 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>Conflicting Email: <strong>{dup.email}</strong> &bull; Share count: {dup.count}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                          {dup.students.map((stu) => (
                            <div key={stu.student_id} className="text-xs p-2 bg-black/40 border border-white/5 rounded-lg">
                              <p className="font-semibold text-white/80">{stu.full_name}</p>
                              <p className="font-mono text-[10px] text-[#c5a059]">ID: {stu.student_id}</p>
                              <p className="text-[10px] text-white/40 truncate">{stu.department}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sections: Missing Required fields */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-[#c5a059] font-bold">
                  Missing Requirements / Null Fields ({data.incomplete.length})
                </h4>
                {data.incomplete.length === 0 ? (
                  <div className="bg-white/2 p-3.5 border border-white/5 rounded-xl text-center text-xs text-white/30">
                    No records found with missing mandatory fields.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
                    {data.incomplete.map((stu) => (
                      <div key={stu.student_id} className="p-3 flex items-center justify-between text-xs gap-3">
                        <div>
                          <p className="font-semibold text-white/95">{stu.full_name || "Unfilled Name"}</p>
                          <p className="text-[10px] text-white/40 font-mono">ID: {stu.student_id}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-0.5 rounded text-[10px]">
                            Incomplete Record card
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sections: Bad format emails */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-[#c5a059] font-bold">
                  Email Format Inconsistencies ({data.formatIssues.length})
                </h4>
                {data.formatIssues.length === 0 ? (
                  <div className="bg-white/2 p-3.5 border border-white/5 rounded-xl text-center text-xs text-white/30">
                    All emails match the standard formatting specification.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
                    {data.formatIssues.map((stu) => (
                      <div key={stu.student_id} className="p-3 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-white">{stu.full_name}</span>
                            <span className="block text-[10px] text-zinc-400 font-mono">{stu.email || "No email"}</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
                          Invalid RFC Pattern
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Admin Actions & Seeding Utility */}
              <div className="mt-4 p-4.5 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h5 className="text-[#c5a059] text-xs font-bold uppercase tracking-wider">
                      Developer & Seeding Authority Menu
                    </h5>
                    <p className="text-[11px] text-[#e0e0e0]/70 mt-0.5">
                      Need a clean sandbox database schema with complete mock profiles, diverse departments, and pristine format validity? You can trigger our database seeding engine to drop the tables and restore the clean 12 record starting set.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdminReseed}
                    disabled={reseedLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-[#c5a059] border border-white/10 hover:border-[#c5a059] text-[#e0e0e0] hover:text-[#080808] disabled:opacity-40 rounded-full transition-all cursor-pointer"
                  >
                    {reseedLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    Re-seed Starter Database
                  </button>
                  <button
                    onClick={fetchIntegrity}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-white rounded-full transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Run Scanner Again
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-white/50 text-xs">
              Diagnostics unavailable.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4.5 border-t border-white/5 bg-[#0a0a0a] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[#c5a059] hover:bg-[#d4af37] text-[#080808] rounded-full transition-all cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
