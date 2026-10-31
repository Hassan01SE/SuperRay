const tones = {
    neutral: "text-slate-400",
    error: "text-rose-400",
    warning: "text-amber-300",
};

const StatusMessage = ({ icon: Icon, title, children, action, tone = "neutral" }) => (
    <div className="card mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center">
        {Icon && <Icon className={`mb-4 text-4xl ${tones[tone]}`} aria-hidden="true" />}
        <h2 className="text-lg font-semibold">{title}</h2>
        {children && <div className="mt-2 text-sm text-slate-400">{children}</div>}
        {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
);

export default StatusMessage;
