interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export default function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">{error}</p>}
      {!error && hint && <p className="text-slate-400 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}
