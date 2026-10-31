import { MdCheckCircleOutline, MdErrorOutline, MdInfoOutline } from "react-icons/md";

const variants = {
    error: { icon: MdErrorOutline, className: "border-rose-500/30 bg-rose-500/10 text-rose-200" },
    success: { icon: MdCheckCircleOutline, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" },
    info: { icon: MdInfoOutline, className: "border-sky-500/30 bg-sky-500/10 text-sky-100" },
    warning: { icon: MdInfoOutline, className: "border-amber-400/30 bg-amber-400/10 text-amber-100" },
};

const Alert = ({ variant = "error", children, className = "" }) => {
    const { icon: Icon, className: tone } = variants[variant];
    return (
        <div role={variant === "error" ? "alert" : "status"} className={`flex gap-2 rounded-lg border px-3.5 py-3 text-sm ${tone} ${className}`}>
            <Icon className="mt-0.5 shrink-0 text-base" aria-hidden="true" />
            <div>{children}</div>
        </div>
    );
};

export default Alert;
