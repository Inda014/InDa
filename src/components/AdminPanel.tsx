import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Gauge,
  Database,
  Flame,
  Sparkles,
  Zap,
  RefreshCw,
  Trash2,
  Trash,
  ShieldAlert,
  Loader2,
  Sliders,
  Check,
  Server
} from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
  onRefreshList: () => void;
  addNotification: (message: string, type: "success" | "error" | "info") => void;
}

export default function AdminPanel({ onClose, onRefreshList, addNotification }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"performance" | "mocking" | "database">("performance");
  const [config, setConfig] = useState({
    simulatedLatencyMs: 0,
    dbType: "SQLite Emulated DB File",
    totalCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [customBulkCount, setCustomBulkCount] = useState<number>(20);
  const [isInjecting, setIsInjecting] = useState<string | null>(null);

  // Fetch admin settings config
  const fetchAdminConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        setConfig({
          simulatedLatencyMs: data.simulatedLatencyMs,
          dbType: data.dbType,
          totalCount: data.totalCount
        });
      }
    } catch {
      addNotification("Could not retrieve administrative config", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminConfig();
  }, []);

  // Update Latency setting
  const handleUpdateLatency = async (latencyVal: number) => {
    try {
      setIsInjecting("latency");
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latency: latencyVal })
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({ ...prev, simulatedLatencyMs: data.simulatedLatencyMs }));
        addNotification(`Network latency set to ${latencyVal}ms.`, "success");
      }
    } catch {
      addNotification("Error modifying server latency settings", "error");
    } finally {
      setIsInjecting(null);
    }
  };

  // Inject faults for Integrity tests
  const handleInjectFault = async (faultType: "duplicate" | "missing" | "format") => {
    try {
      setIsInjecting(faultType);
      const res = await fetch("/api/admin/inject-fault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faultType })
      });
      if (res.ok) {
        const data = await res.json();
        addNotification(data.message || "Fault injected successfully!", "info");
        await fetchAdminConfig();
        onRefreshList();
      } else {
        throw new Error();
      }
    } catch {
      addNotification("Failed to execute administrative fault injection", "error");
    } finally {
      setIsInjecting(null);
    }
  };

  // Bulk mock generator
  const handleInjectBulk = async () => {
    try {
      setIsInjecting("bulk");
      const res = await fetch("/api/admin/inject-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: customBulkCount })
      });
      if (res.ok) {
        const data = await res.json();
        addNotification(data.message || "Bulk injection finished!", "success");
        await fetchAdminConfig();
        onRefreshList();
      } else {
        throw new Error();
      }
    } catch {
      addNotification("Failed to bulk generate mock students", "error");
    } finally {
      setIsInjecting(null);
    }
  };

  // Nuclear Database Clear (Nuke)
  const handleNukeDB = async () => {
    if (!window.confirm("WARNING: Doing this will wipe the system database. Are you sure you want to proceed?")) {
      return;
    }
    try {
      setIsInjecting("nuke");
      const res = await fetch("/api/admin/nuke", { method: "POST" });
      if (res.ok) {
        addNotification("Database completely purged.", "info");
        await fetchAdminConfig();
        onRefreshList();
      }
    } catch {
      addNotification("Nuclear clear execution failed", "error");
    } finally {
      setIsInjecting(null);
    }
  };

  // Re-seed Database to starter pack of 12 clean entries
  const handleReseedDB = async () => {
    try {
      setIsInjecting("reseed");
      const res = await fetch("/api/reseed", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        addNotification(data.message || "Database successfully restored to clean seed data", "success");
        await fetchAdminConfig();
        onRefreshList();
      }
    } catch {
      addNotification("Restoration of baseline seeds failed", "error");
    } finally {
      setIsInjecting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in print:hidden">
      {/* Backdrop */}
      <motion.div
        id="admin-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#080808]/40"
      />

      {/* Main Container */}
      <motion.div
        id="admin-panel-container"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative bg-[#0d0d0d] rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 text-white font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/5 bg-gradient-to-r from-zinc-950 to-black select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 rounded-xl">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#c5a059] font-mono">
                System Administration Control
              </h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                Academicus Registry Sandbox &bull; QA Suite
              </p>
            </div>
          </div>
          <button
            id="close-admin-btn"
            onClick={onClose}
            className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-transparent transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 bg-zinc-950/60 p-1">
          <button
            onClick={() => setActiveTab("performance")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-lg transition-all ${
              activeTab === "performance"
                ? "bg-white/5 text-[#c5a059] border border-white/10"
                : "text-white/40 hover:text-white/70 hover:bg-white/2"
            }`}
          >
            Performance Settings
          </button>
          <button
            onClick={() => setActiveTab("mocking")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-lg transition-all ${
              activeTab === "mocking"
                ? "bg-white/5 text-[#c5a059] border border-white/10"
                : "text-white/40 hover:text-white/70 hover:bg-white/2"
            }`}
          >
            Fault Inject & Bulk Gen
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider font-mono rounded-lg transition-all ${
              activeTab === "database"
                ? "bg-white/5 text-[#c5a059] border border-white/10"
                : "text-white/40 hover:text-white/70 hover:bg-white/2"
            }`}
          >
            Database Actions
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-950/20">
          
          {/* Quick Engine Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white/2 rounded-xl border border-white/5 text-xs">
            <div>
              <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider">Engine Structure</span>
              <span className="font-mono text-white/90 truncate block">{config.dbType}</span>
            </div>
            <div>
              <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider">Latency Delay</span>
              <span className="font-mono text-[#c5a059] font-bold block">{config.simulatedLatencyMs}ms</span>
            </div>
            <div>
              <span className="block text-[9px] text-white/30 font-bold uppercase tracking-wider">Registered Rows</span>
              <span className="font-mono text-white/90 block">{config.totalCount} records</span>
            </div>
          </div>

          {/* TAB 1: Performance Simulators */}
          {activeTab === "performance" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-[#c5a059] tracking-wider font-mono mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#c5a059]" />
                  Simulated Server Ping Delay
                </h4>
                <p className="text-xs text-white/50 mb-3 leading-relaxed">
                  Apply simulated backend server response times. Test responsiveness, dynamic React page spinners, loading skeletons, and interactive state indicators in real time.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: "0ms (Default)", value: 0 },
                    { label: "300ms (Fast 3G)", value: 300 },
                    { label: "1200ms (Slow WAN)", value: 1200 },
                    { label: "3500ms (High Packet Loss)", value: 3500 }
                  ].map((preset) => {
                    const isSelected = config.simulatedLatencyMs === preset.value;
                    return (
                      <button
                        key={preset.value}
                        onClick={() => handleUpdateLatency(preset.value)}
                        disabled={isInjecting === "latency"}
                        className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#c5a059]/10 border-[#c5a059] text-white"
                            : "bg-white/2 border-white/5 hover:border-white/20 select-none text-white/60 hover:text-white"
                        }`}
                      >
                        <span className="block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                          {preset.label}
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-white/40">
                          {isSelected && <Check className="w-3 h-3 text-[#c5a059]" />}
                          <span>{preset.value}ms sleep</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4.5 bg-white/2 rounded-xl border border-white/5 text-xs text-white/50 space-y-2 leading-relaxed">
                <span className="block font-bold text-white uppercase font-mono text-[10px] tracking-wider">
                  🧪 How to test this latency:
                </span>
                <p>
                  1. Set latency to <strong>1200ms</strong> above.
                  <br />
                  2. Close this Admin Panel and click on any folder directory search or pagination number.
                  <br />
                  3. Observe the custom polished golden skeleton card views placeholders as the asynchronous cache processes!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Fault Injection & QA Sandboxes */}
          {activeTab === "mocking" && (
            <div className="space-y-6">
              
              {/* FAULT INJECTOR */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#c5a059] tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#c5a059]" />
                  Simulate Database Integrity Faults (QA Testing)
                </h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  Inject flawed student models directly into the SQL engine. Used to verify that the **Sync Integrity administrative scanner** correctly flags formatting violations, duplicate registrations, or missing properties.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      title: "Duplicate Emails",
                      desc: "Adds 2 records sharing one identical email account address.",
                      type: "duplicate",
                      label: "Inject duplicate email pair"
                    },
                    {
                      title: "Missing Properties",
                      desc: "Adds an anonymous profile with empty contact/classroom values.",
                      type: "missing",
                      label: "Inject blank critical values"
                    },
                    {
                      title: "RFC Format Failure",
                      desc: "Adds a user with write-in email formatted as 'malformed-domain'.",
                      type: "format",
                      label: "Inject RFC layout violation"
                    }
                  ].map((fault) => (
                    <div
                      key={fault.type}
                      className="p-3.5 bg-white/2 border border-white/5 hover:border-white/10 rounded-xl flex flex-col justify-between"
                    >
                      <div className="mb-3">
                        <span className="block font-semibold text-xs text-white mb-1">
                          {fault.title}
                        </span>
                        <span className="block text-[11px] text-white/50 leading-relaxed">
                          {fault.desc}
                        </span>
                      </div>
                      <button
                        onClick={() => handleInjectFault(fault.type as any)}
                        disabled={isInjecting !== null}
                        className="w-full py-1.5 px-3 bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 hover:border-red-500/50 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isInjecting === fault.type ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Flame className="w-3 h-3" />
                        )}
                        {fault.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BULK GENERATOR */}
              <div className="border-t border-white/5 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#c5a059] tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  Clean Bulk Randomized Student Generator
                </h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  Need to check how rapid pagination, sorting, and free-text searches handle larger volumes? Quickly load up to 100 randomized student registers with realistic details & department avatars.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/2 p-3 rounded-xl border border-white/5">
                  <div className="w-full sm:flex-1">
                    <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-white/40 mb-1.5">
                      <span>Records to generate</span>
                      <span className="text-[#c5a059]">{customBulkCount} register rows</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={customBulkCount}
                      onChange={(e) => setCustomBulkCount(parseInt(e.target.value))}
                      className="w-full accent-[#c5a059] cursor-ew-resize bg-zinc-800 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  <button
                    onClick={handleInjectBulk}
                    disabled={isInjecting !== null}
                    className="w-full sm:w-auto px-5 py-3.5 bg-[#c5a059] hover:bg-[#d4af37] text-zinc-950 font-bold uppercase tracking-wider font-mono text-[10px] rounded-xl flex items-center justify-center gap-2 self-end shrink-0 transition-all cursor-pointer"
                  >
                    {isInjecting === "bulk" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    Generate Registrants
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Database Admin Powers */}
          {activeTab === "database" && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-[#c5a059] tracking-wider font-mono flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#c5a059]" />
                System Datastore Maintenance & Restoration
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Perform heavy administrative actions directly on the backend emulated SQLite engine. You can reset records back to the baseline starter dataset or clear the tables entirely to demonstrate empty states.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seed reset */}
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-sm text-white block mb-1">
                      Restore Baseline Seed
                    </span>
                    <p className="text-xs text-white/50 leading-relaxed mb-4">
                      Drops any custom, bulk, or flawed records, restoring the database perfectly to the pristine initial set of 12 academic models.
                    </p>
                  </div>
                  <button
                    onClick={handleReseedDB}
                    disabled={isInjecting !== null}
                    className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 text-xs font-mono uppercase font-bold tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isInjecting === "reseed" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Restore Baseline Sets
                  </button>
                </div>

                {/* Database Wipe */}
                <div className="p-4 bg-red-950/15 rounded-xl border border-red-500/10 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-sm text-red-400 block mb-1">
                      Nuclear Erase Database
                    </span>
                    <p className="text-xs text-white/50 leading-relaxed mb-4">
                      Deletes all student registrations instantaneously. Perfect for reviewing layout empty states, mock handling, and the initial setup pipeline.
                    </p>
                  </div>
                  <button
                    onClick={handleNukeDB}
                    disabled={isInjecting !== null}
                    className="w-full py-2.5 px-4 bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-mono uppercase font-bold tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isInjecting === "nuke" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Nuclear Clear Table
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-zinc-950/80 flex items-center justify-between text-[10px] font-mono select-none text-white/40">
          <span>Session IP: Simulated Admin Context</span>
          <span>Security Zone: QA-SANDBOX-EMULATOR</span>
        </div>
      </motion.div>
    </div>
  );
}
