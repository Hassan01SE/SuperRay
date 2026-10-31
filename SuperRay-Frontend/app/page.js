import Image from "next/image";
import Link from "next/link";
import { MdArrowForward } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { IS_DEMO_MODE, SOURCE_CODE_URL } from "../utils/config";
import sampleImage from "../public/demo/sample-chest-1.jpg";

const pipeline = [
  {
    title: "Upload",
    body: "A PNG or JPEG X-ray or CT image is uploaded through the browser and validated by the Django REST API.",
  },
  {
    title: "Super-resolution",
    body: "An SR-GAN model upscales the image to recover detail lost to low resolution or poor acquisition.",
  },
  {
    title: "Classification",
    body: "A DenseNet classifier identifies the imaging domain, such as chest, and screens out non-medical images.",
  },
  {
    title: "Report drafting",
    body: "A language model drafts a diagnostic report from the model outputs for a radiologist to review.",
  },
  {
    title: "AI radiologist chat",
    body: "Signed-in users can save reports and ask follow-up questions about a report in a chat assistant.",
  },
];

const status = [
  { component: "Web interface", detail: "Next.js frontend on Vercel", online: true },
  { component: "Accounts and saved reports", detail: "Django REST API with PostgreSQL", online: false },
  { component: "SR-GAN, DenseNet and LLM inference", detail: "External GPU inference service", online: false },
  { component: "AI radiologist chat", detail: "Depends on the inference service", online: false },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-white/10">
        <div className="page grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="eyebrow">Final Year Design Project · NED University</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Sharper medical images and draft reports, in one workflow.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              SuperRay combines generative super-resolution, image classification and LLM-assisted reporting to help
              radiologists review X-rays and CT scans. It is a research prototype and is not intended for clinical use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/upload" className="btn-primary px-5 py-3 text-base">
                Analyze an image <MdArrowForward aria-hidden="true" />
              </Link>
              <Link href={IS_DEMO_MODE ? "/reports/sample-1" : "/reports"} className="btn-secondary px-5 py-3 text-base">
                {IS_DEMO_MODE ? "View a sample report" : "My reports"}
              </Link>
            </div>
          </div>

          <figure className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-medium text-slate-200">Chest radiograph</span>
              <span className="badge-sample">Sample image</span>
            </div>
            <div className="bg-black">
              <Image
                src={sampleImage}
                alt="Sample frontal chest X-ray"
                className="mx-auto max-h-[420px] w-auto object-contain"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-slate-500">
              Illustration of the report viewer. Sample images are used while the inference service is offline.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-white/10 py-16 lg:py-20" aria-labelledby="pipeline-heading">
        <div className="page">
          <p className="eyebrow">How it works</p>
          <h2 id="pipeline-heading" className="mt-3 text-3xl font-semibold tracking-tight">From upload to reviewed report</h2>
          <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {pipeline.map((step, index) => (
              <li key={step.title} className="relative border-t border-white/15 pt-5">
                <span className="text-sm font-semibold text-brand">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-white/10 py-16 lg:py-20" aria-labelledby="video-heading">
        <div className="page grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Project walkthrough</p>
            <h2 id="video-heading" className="mt-3 text-3xl font-semibold tracking-tight">SuperRay in a nutshell</h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              A recorded walkthrough of the original system, including image upload, report generation and the AI
              radiologist chat, captured while the backend and models were running.
            </p>
          </div>
          <iframe
            className="aspect-video w-full rounded-xl border border-white/10 bg-black"
            src="https://www.youtube-nocookie.com/embed/m9m5HDPewp4"
            title="SuperRay project walkthrough"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      <section id="project-status" className="scroll-mt-24 py-16 lg:py-20" aria-labelledby="status-heading">
        <div className="page">
          <p className="eyebrow">Project status</p>
          <h2 id="status-heading" className="mt-3 text-3xl font-semibold tracking-tight">What is running today</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
            {IS_DEMO_MODE
              ? "The original backend and GPU inference service are offline, so this deployment runs in demonstration mode. Pages that need them show clearly labelled sample data instead of live results."
              : "This deployment is connected to a live backend. Results depend on the availability of the external inference service."}
          </p>
          <a href={SOURCE_CODE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6">
            <FaGithub aria-hidden="true" /> View the frontend and backend source code
          </a>
          <div className="card mt-8 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Component</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Runs on</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {status.map((row) => (
                  <tr key={row.component}>
                    <td className="px-4 py-3 text-slate-200">{row.component}</td>
                    <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">{row.detail}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${row.online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/15 bg-white/5 text-slate-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${row.online ? "bg-emerald-400" : "bg-slate-500"}`} aria-hidden="true" />
                        {row.online ? "Online" : IS_DEMO_MODE ? "Offline · sample data" : "Configured"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
