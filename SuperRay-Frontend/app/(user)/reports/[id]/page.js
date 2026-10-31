'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MdChevronLeft, MdErrorOutline, MdSearchOff } from "react-icons/md";
import Loading from "../../../loading";
import Alert from "../../../components/UI/Alert";
import StatusMessage from "../../../components/UI/StatusMessage";
import SignInRequired from "../../../components/UI/SignInRequired";
import ReportView from "../../../components/report/ReportView";
import DownloadPdfButton from "../../../components/report/DownloadPdfButton";
import ChatPanel from "../../../components/chat/ChatPanel";
import useAxiosAuth from "../../../../utils/hooks/useAxiosAuth";
import { IS_DEMO_MODE } from "../../../../utils/config";
import { describeApiError } from "../../../../utils/errors";
import { resolveMediaUrl } from "../../../../utils/media";
import { getSampleReport } from "../../../../utils/demo";

const ReportLayout = ({ report, imageUrl, isSample }) => {
    const [pdfError, setPdfError] = useState(null);
    return (
        <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <Link href="/reports" className="btn-ghost -ml-3">
                    <MdChevronLeft className="text-lg" aria-hidden="true" /> All reports
                </Link>
                <DownloadPdfButton report={report} imageUrl={imageUrl} isSample={isSample} onError={setPdfError} />
            </div>
            {pdfError && <Alert className="mb-6">{pdfError}</Alert>}
            <ReportView report={report} imageUrl={imageUrl} isSample={isSample} />
            <ChatPanel reportId={report.id} isSample={isSample} />
        </>
    );
};

const NotFound = () => (
    <StatusMessage
        icon={MdSearchOff}
        title="Report not found"
        action={<Link href="/reports" className="btn-secondary">Back to reports</Link>}
    >
        This report doesn&apos;t exist or belongs to another account.
    </StatusMessage>
);

const SampleReport = ({ id }) => {
    const report = getSampleReport(id);
    if (!report) return <NotFound />;
    return <ReportLayout report={report} imageUrl={report.image} isSample />;
};

const LiveReport = ({ id }) => {
    const { status } = useSession();
    const axiosAuth = useAxiosAuth();
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (status !== "authenticated") return;
        let cancelled = false;
        setError(null);
        axiosAuth
            .get(`reports/${id}/`)
            .then(({ data }) => !cancelled && setReport(data))
            .catch((err) => !cancelled && setError(err));
        return () => {
            cancelled = true;
        };
    }, [id, status, attempt, axiosAuth]);

    if (status === "loading") return <Loading />;
    if (status === "unauthenticated") return <SignInRequired what="this report" />;
    if (error?.response?.status === 404) return <NotFound />;
    if (error) {
        return (
            <StatusMessage
                icon={MdErrorOutline}
                tone="error"
                title="Report unavailable"
                action={<button type="button" className="btn-secondary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>}
            >
                {describeApiError(error, "This report could not be loaded.")}
            </StatusMessage>
        );
    }
    if (!report) return <Loading />;

    return <ReportLayout report={report} imageUrl={resolveMediaUrl(report.image)} />;
};

const ReportPage = () => {
    const { id } = useParams();
    return (
        <div className="page max-w-5xl py-8 pb-28 lg:py-12">
            {IS_DEMO_MODE ? <SampleReport id={id} /> : <LiveReport id={id} />}
        </div>
    );
};

export default ReportPage;
