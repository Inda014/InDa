import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { SystemNotification } from "../types";

interface NotificationToastProps {
  notifications: SystemNotification[];
  removeNotification: (id: string) => void;
}

export default function NotificationToast({
  notifications,
  removeNotification,
}: NotificationToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => {
          return (
            <ToastItem
              key={notif.id}
              notification={notif}
              onClose={() => removeNotification(notif.id)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  notification,
  onClose,
}: {
  key?: string;
  notification: SystemNotification;
  onClose: () => void;
}) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const alertStyles = {
    success: {
      bg: "bg-white border-l-4 border-emerald-500",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
      text: "text-emerald-800",
    },
    error: {
      bg: "bg-white border-l-4 border-rose-500",
      icon: <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />,
      text: "text-rose-800",
    },
    info: {
      bg: "bg-white border-l-4 border-indigo-500",
      icon: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
      text: "text-indigo-800",
    },
  };

  const style = alertStyles[notification.type] || alertStyles.info;

  return (
    <motion.div
      id={`toast-${notification.id}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-xl border border-slate-100 ${style.bg} transition-all`}
    >
      {style.icon}
      <div className="flex-1 text-sm font-medium text-slate-800">
        {notification.message}
      </div>
      <button
        id={`toast-close-${notification.id}`}
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 rounded p-0.5 hover:bg-slate-50 transition-colors"
        aria-label="Close message"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
