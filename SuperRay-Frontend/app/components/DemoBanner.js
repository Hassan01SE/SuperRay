import Link from "next/link";
import { MdInfoOutline } from "react-icons/md";

const DemoBanner = () => (
    <div role="status" className="border-b border-amber-400/20 bg-amber-400/10">
        <div className="page flex flex-col gap-1 py-2.5 text-sm text-amber-100 sm:flex-row sm:items-center sm:gap-3">
            <p className="flex items-start gap-2">
                <MdInfoOutline className="mt-0.5 shrink-0 text-base text-amber-300" aria-hidden="true" />
                <span>
                    <strong className="font-semibold text-amber-200">Demonstration mode:</strong> the original backend and AI
                    services are currently offline. Explore the interface using clearly labelled sample data.
                </span>
            </p>
            <Link href="/#project-status" className="shrink-0 pl-6 font-medium text-amber-200 underline underline-offset-2 sm:pl-0">
                What works?
            </Link>
        </div>
    </div>
);

export default DemoBanner;
