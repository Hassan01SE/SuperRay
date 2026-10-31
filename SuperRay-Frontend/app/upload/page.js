'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Spinner } from "@nextui-org/react";
import { MdClose, MdOutlineDescription } from "react-icons/md";
import ImageDropzone from "../components/upload/ImageDropzone";
import Alert from "../components/UI/Alert";
import useAxiosAuth from "../../utils/hooks/useAxiosAuth";
import { INFERENCE_TIMEOUT_MS } from "../../utils/axios";
import { ACCEPTED_IMAGE_TYPES, IS_DEMO_MODE, MAX_UPLOAD_SIZE_MB } from "../../utils/config";
import { describeApiError } from "../../utils/errors";

function validateFile(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Only PNG and JPEG images are supported.";
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) return `The image must be ${MAX_UPLOAD_SIZE_MB} MB or smaller.`;
    return null;
}

function base64ToFile(base64, name) {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return new File([bytes], name, { type: "image/jpeg" });
}

const ImagePanel = ({ title, src, alt, badge }) => (
    <figure className="card overflow-hidden">
        <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200">
            {title}
            {badge}
        </figcaption>
        <div className="flex h-72 items-center justify-center bg-black sm:h-96">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
    </figure>
);

const Upload = () => {
    const axiosAuth = useAxiosAuth();
    const router = useRouter();
    const { status } = useSession();

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileError, setFileError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

    const selectFile = (selected) => {
        const problem = validateFile(selected);
        setFileError(problem);
        setError(null);
        setResult(null);
        if (problem) return;
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
    };

    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
        setSaveError(null);
        setFileError(null);
    };

    const generateReport = async () => {
        setIsProcessing(true);
        setError(null);
        const formData = new FormData();
        formData.append("image", file);
        try {
            const { data } = await axiosAuth.post("super-resolution/", formData, { timeout: INFERENCE_TIMEOUT_MS });
            setResult({ image: data.image, report: data.xreport, domain: data.domain });
        } catch (err) {
            setError(describeApiError(err, "The report could not be generated. Please try again."));
        } finally {
            setIsProcessing(false);
        }
    };

    const saveReport = async () => {
        setIsSaving(true);
        setSaveError(null);
        const formData = new FormData();
        formData.append("image", base64ToFile(result.image, "enhanced.jpg"));
        formData.append("diagnose", result.report);
        formData.append("domain", result.domain);
        try {
            const { data } = await axiosAuth.post("save-report", formData);
            router.push(`/reports/${data.id}`);
        } catch (err) {
            setSaveError(describeApiError(err, "The report could not be saved."));
            setIsSaving(false);
        }
    };

    return (
        <div className="page py-10 lg:py-14">
            <header className="max-w-2xl">
                <p className="eyebrow">Analyze image</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">Enhance an image and draft a report</h1>
                <p className="mt-3 text-slate-400">
                    Upload an X-ray or CT image. SuperRay upscales it with SR-GAN, classifies it with DenseNet and drafts a report
                    for review by a qualified radiologist.
                </p>
            </header>

            {IS_DEMO_MODE && (
                <Alert variant="warning" className="mt-6 max-w-3xl">
                    Live analysis needs the AI inference service, which is offline. You can still select an image to see the
                    workflow. It stays in your browser and is never uploaded.{" "}
                    <Link href="/reports/sample-1" className="font-semibold underline underline-offset-2">Open a sample report</Link>{" "}
                    to see what a finished result looks like.
                </Alert>
            )}

            {!result && (
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                        <ImageDropzone onFileSelected={selectFile} disabled={isProcessing} />
                        {fileError && <Alert>{fileError}</Alert>}
                        {error && <Alert>{error}</Alert>}

                        {file && (
                            <div className="card flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button type="button" onClick={reset} disabled={isProcessing} className="btn-ghost px-2" aria-label="Remove selected image">
                                    <MdClose className="text-lg" />
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={generateReport}
                            disabled={!file || isProcessing || IS_DEMO_MODE}
                            className="btn-primary w-full py-3 text-base"
                        >
                            {isProcessing && <Spinner size="sm" color="current" />}
                            {isProcessing ? "Analyzing image..." : IS_DEMO_MODE ? "Generate report (offline)" : "Generate report"}
                        </button>
                        {isProcessing && (
                            <p className="text-center text-sm text-slate-400" aria-live="polite">
                                Upscaling and drafting a report can take up to two minutes.
                            </p>
                        )}
                    </div>

                    {previewUrl ? (
                        <ImagePanel title="Selected image" src={previewUrl} alt="Preview of the selected image" />
                    ) : (
                        <div className="card flex min-h-[18rem] flex-col items-center justify-center px-6 text-center text-slate-500">
                            <MdOutlineDescription className="text-4xl" aria-hidden="true" />
                            <p className="mt-3 text-sm">Your image preview will appear here.</p>
                        </div>
                    )}
                </div>
            )}

            {result && (
                <section className="mt-8 space-y-6" aria-labelledby="result-heading">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 id="result-heading" className="text-xl font-semibold">Result</h2>
                        <button type="button" onClick={reset} className="btn-secondary">Analyze another image</button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ImagePanel title="Original" src={previewUrl} alt="Original uploaded image" />
                        <ImagePanel
                            title="Enhanced (SR-GAN)"
                            src={`data:image/jpeg;base64,${result.image}`}
                            alt="Super-resolved image returned by the model"
                            badge={<span className="badge-neutral">{result.domain}</span>}
                        />
                    </div>

                    <div className="card p-5">
                        <h3 className="font-semibold">Draft report</h3>
                        <p className="mt-1 text-xs text-slate-500">AI-generated draft. It must be reviewed by a qualified radiologist.</p>
                        <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-200">{result.report}</p>
                    </div>

                    {saveError && <Alert>{saveError}</Alert>}
                    {status === "authenticated" ? (
                        <button type="button" onClick={saveReport} disabled={isSaving} className="btn-primary">
                            {isSaving && <Spinner size="sm" color="current" />}
                            {isSaving ? "Saving..." : "Save report and open chat"}
                        </button>
                    ) : (
                        <Alert variant="info">
                            <Link href="/login" className="font-semibold underline underline-offset-2">Sign in</Link> to save this report
                            and discuss it with the AI radiologist. Unsaved results are lost when you leave this page.
                        </Alert>
                    )}
                </section>
            )}
        </div>
    );
};

export default Upload;
