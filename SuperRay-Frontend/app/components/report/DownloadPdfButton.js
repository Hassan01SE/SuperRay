'use client'
import { useState } from "react";
import { Spinner } from "@nextui-org/react";
import { MdDownload } from "react-icons/md";
import logo from "../../../public/srblue.png";

const DownloadPdfButton = ({ report, imageUrl, isSample = false, onError }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const download = async () => {
        setIsGenerating(true);
        onError?.(null);
        try {
            // react-pdf is heavy, only load it when needed
            const [{ pdf }, { default: ReportDocument }] = await Promise.all([
                import("@react-pdf/renderer"),
                import("./ReportDocument"),
            ]);
            const absolute = (url) => new URL(url, window.location.origin).toString();
            const blob = await pdf(
                <ReportDocument report={report} imageUrl={absolute(imageUrl)} logoUrl={absolute(logo.src)} isSample={isSample} />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = isSample ? "superray-sample-report.pdf" : `superray-report-${report.id}.pdf`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error("PDF generation failed:", error);
            onError?.("The PDF could not be created. The report image may be unavailable.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button type="button" onClick={download} disabled={isGenerating || !imageUrl} className="btn-secondary">
            {isGenerating ? <Spinner size="sm" color="current" /> : <MdDownload className="text-lg" aria-hidden="true" />}
            {isGenerating ? "Preparing PDF..." : "Download PDF"}
        </button>
    );
};

export default DownloadPdfButton;
