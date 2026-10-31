import Link from "next/link";
import Alert from "../UI/Alert";
import { IS_DEMO_MODE } from "../../../utils/config";

const AuthCard = ({ title, subtitle, children, footer, wide = false }) => (
    <div className="page flex justify-center py-12 lg:py-16">
        <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
            </div>
            {IS_DEMO_MODE && (
                <Alert variant="warning" className="mb-4">
                    Accounts are stored by the SuperRay backend, which is offline, so sign-in and registration are disabled.{" "}
                    <Link href="/reports" className="font-semibold underline underline-offset-2">Browse sample reports</Link> instead.
                </Alert>
            )}
            <div className="card p-6 sm:p-8">{children}</div>
            {footer && <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>}
        </div>
    </div>
);

export default AuthCard;
