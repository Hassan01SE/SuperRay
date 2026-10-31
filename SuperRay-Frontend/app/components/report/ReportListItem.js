'use client'
import { useState } from "react";
import Link from "next/link";
import { MdBrokenImage, MdChevronRight } from "react-icons/md";
import { formatDateTime } from "../../../utils/format";

const ReportListItem = ({ report, imageUrl, isSample = false }) => {
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <li>
            <Link
                href={`/reports/${report.id}`}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-ink-900 p-3 transition-colors hover:border-white/20 hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black sm:h-20 sm:w-20">
                    {imageUrl && !imageFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
                    ) : (
                        <MdBrokenImage className="text-2xl text-slate-600" aria-hidden="true" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{isSample ? "Sample report" : `Report #${report.id}`}</h2>
                        {report.domain && <span className="badge-neutral">{report.domain}</span>}
                        {isSample && <span className="badge-sample">Sample data</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{formatDateTime(report.date)}</p>
                    <p className="mt-1 hidden truncate text-sm text-slate-500 sm:block">{report.diagnose}</p>
                </div>
                <MdChevronRight className="shrink-0 text-2xl text-slate-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
        </li>
    );
};

export default ReportListItem;
