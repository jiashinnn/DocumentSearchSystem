export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-4 shrink-0">
      <div className="w-full px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} OmniDoc. Credit to Lim Jia Shin.</p>
        <div className="flex gap-4">
          <span className="font-semibold text-slate-400">Internal Use Only</span>
        </div>
      </div>
    </footer>
  );
}
