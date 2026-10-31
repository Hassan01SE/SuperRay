'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MdErrorOutline, MdOutlineDescription } from "react-icons/md";
import Loading from "../../loading";
import Alert from "../../components/UI/Alert";
import StatusMessage from "../../components/UI/StatusMessage";
import SignInRequired from "../../components/UI/SignInRequired";
import ReportListItem from "../../components/report/ReportListItem";
import useAxiosAuth from "../../../utils/hooks/useAxiosAuth";
import { IS_DEMO_MODE } from "../../../utils/config";
import { describeApiError } from "../../../utils/errors";
import { resolveMediaUrl } from "../../../utils/media";
import { sampleReports } from "../../../utils/demo";

const PAGE_SIZE = 8;

const Header = ({ count }) => (
    <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
            <p className="eyebrow">Reports</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Your reports</h1>
            {count > 0 && <p className="mt-2 text-sm text-slate-400">{count} saved {count === 1 ? "report" : "reports"}</p>}
        </div>
        <Link href="/upload" className="btn-primary">New analysis</Link>
    </header>
);

const SampleReports = () => (
    <>
        <Header count={sampleReports.length} />
        <Alert variant="warning" className="mt-6">
            Saved reports live in the SuperRay backend, which is offline. These are sample records for demonstration only.
        </Alert>
        <ul className="mt-6 space-y-3">
            {sampleReports.map((report) => (
                <ReportListItem key={report.id} report={report} imageUrl={report.image} isSample />
            ))}
        </ul>
    </>
);

const LiveReports = () => {
    const { status } = useSession();
    const axiosAuth = useAxiosAuth();
    const [reports, setReports] = useState(null);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (status !== "authenticated") return;
        let cancelled = false;
        setError(null);
        setReports(null);
        axiosAuth
            .get("reports")
            .then(({ data }) => !cancelled && setReports(data))
            .catch((err) => !cancelled && setError(describeApiError(err, "Your reports could not be loaded.")));
        return () => {
            cancelled = true;
        };
    }, [status, attempt, axiosAuth]);

    if (status === "loading") return <Loading />;
    if (status === "unauthenticated") return <SignInRequired what="your saved reports" />;

    if (error) {
        return (
            <StatusMessage
                icon={MdErrorOutline}
                tone="error"
                title="Reports unavailable"
                action={<button type="button" className="btn-secondary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>}
            >
                {error}
            </StatusMessage>
        );
    }
    if (!reports) return <Loading />;

    const pageCount = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
    const visible = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <>
            <Header count={reports.length} />
            {reports.length === 0 ? (
                <div className="mt-8">
                    <StatusMessage
                        icon={MdOutlineDescription}
                        title="No reports yet"
                        action={<Link href="/upload" className="btn-primary">Analyze an image</Link>}
                    >
                        Reports you save after analyzing an image will appear here.
                    </StatusMessage>
                </div>
            ) : (
                <>
                    <ul className="mt-8 space-y-3">
                        {visible.map((report) => (
                            <ReportListItem key={report.id} report={report} imageUrl={resolveMediaUrl(report.image)} />
                        ))}
                    </ul>
                    {pageCount > 1 && (
                        <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
                            <button type="button" className="btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                Previous
                            </button>
                            <span className="text-sm text-slate-400">Page {page} of {pageCount}</span>
                            <button type="button" className="btn-secondary" disabled={page === pageCount} onClick={() => setPage(page + 1)}>
                                Next
                            </button>
                        </nav>
                    )}
                </>
            )}
        </>
    );
};

const Reports = () => (
    <div className="page max-w-4xl py-10 lg:py-14">{IS_DEMO_MODE ? <SampleReports /> : <LiveReports />}</div>
);

export default Reports;
