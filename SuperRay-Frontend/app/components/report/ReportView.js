'use client'
import { useState } from "react";
import Image from "next/image";
import { MdBrokenImage } from "react-icons/md";
import logo from "../../../public/srblue.png";
import { formatDateTime } from "../../../utils/format";
import { SAMPLE_REPORT_NOTICE } from "../../../utils/demo";

export const DISCLAIMER =
    "The AI diagnostics provided by SuperRay are intended for research and educational purposes only and must not be relied upon for clinical decision-making. Results may be inaccurate or incomplete and must be reviewed by a qualified healthcare professional.";

const ReportView = ({ report, imageUrl, isSample = false }) => {
    const [imageFailed, setImageFailed] = useState(false);

    return (
        <article className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white text-slate-700 shadow-2xl shadow-black/40">
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
                <Image src={logo} alt="SuperRay" className="-my-2 -ml-2 h-9 w-auto sm:h-12" />
                <dl className="text-right text-xs text-slate-500">
                    <div>
                        <dt className="inline">Report </dt>
                        <dd className="inline font-semibold text-slate-800">{isSample ? "Sample" : `#${report.id}`}</dd>
                    </div>
                    <div>
                        <dt className="sr-only">Created</dt>
                        <dd>{formatDateTime(report.date)}</dd>
                    </div>
                </dl>
            </header>

            {isSample && (
                <p className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs leading-relaxed text-amber-900">{SAMPLE_REPORT_NOTICE}</p>
            )}

            <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <figure>
                    <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                        {imageUrl && !imageFailed ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imageUrl}
                                alt={`${isSample ? "Sample" : "Enhanced"} ${report.domain || "medical"} image`}
                                className="h-full w-full object-contain"
                                onError={() => setImageFailed(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-slate-400">
                                <MdBrokenImage className="text-3xl" aria-hidden="true" />
                                The image could not be loaded.
                            </div>
                        )}
                    </div>
                    <figcaption className="mt-2 text-center text-xs capitalize text-slate-500">
                        {isSample ? "Sample" : "Upscaled"} {report.domain} image
                    </figcaption>
                </figure>

                <section aria-labelledby="findings-heading">
                    <dl className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 text-sm">
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">Domain</dt>
                            <dd className="mt-0.5 font-medium capitalize text-slate-900">{report.domain || "Unknown"}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-slate-500">Source</dt>
                            <dd className="mt-0.5 font-medium text-slate-900">{isSample ? "Hand-written sample" : "SuperRay AI draft"}</dd>
                        </div>
                    </dl>
                    <h2 id="findings-heading" className="mt-5 text-lg font-semibold text-slate-900">Findings</h2>
                    <p className="mt-2 whitespace-pre-line leading-relaxed">{report.diagnose}</p>
                </section>
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs leading-relaxed text-slate-500">
                <strong className="font-semibold text-slate-700">Disclaimer:</strong> {DISCLAIMER}
            </footer>
        </article>
    );
};

export default ReportView;
