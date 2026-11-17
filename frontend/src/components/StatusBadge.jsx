const styles = {
  online: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  offline: "bg-red-50 text-red-700 ring-red-600/20",
  checking: "bg-slate-100 text-slate-600 ring-slate-500/20",
};
const labels = { online: "Online", offline: "Offline", checking: "Checking" };

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
