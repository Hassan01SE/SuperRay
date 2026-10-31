import Image from "next/image";
import unskilledTechnicianImage from "../../public/unskilledtechnician.jpg";
import inconsistentReportImage from "../../public/inconsistentreport.jpg";
import scatteredRadiationImage from "../../public/probimgscattered.jpg";
import hassanPhoto from "../../public/hassan.jpg";
import sabihPhoto from "../../public/sabih.jpeg";
import jamalPhoto from "../../public/jamal.jpeg";
import TeamMember from "../components/UI/TeamMember";

export const metadata = { title: "About" };

const problems = [
    {
        title: "Variable acquisition quality",
        image: unskilledTechnicianImage,
        body: "Image quality depends on technician experience and equipment, and low-quality scans can make diagnosis harder.",
    },
    {
        title: "Scattered radiation",
        image: scatteredRadiationImage,
        body: "Scattered radiation degrades contrast and detail, making it harder to obtain clear diagnostic images.",
    },
    {
        title: "Inconsistent reports",
        image: inconsistentReportImage,
        body: "Reports vary with workload and experience. A consistent, reviewable first draft can support radiologists.",
    },
];

const team = [
    {
        name: "Sabih ur Rahman",
        role: "ML Developer",
        photo: sabihPhoto,
        github: "https://github.com/Sabih-Rahman5",
        linkedin: "https://www.linkedin.com/in/sabih-rahman/",
        mail: "sabih.562@gmail.com",
    },
    {
        name: "Hassan Sohail",
        role: "Full Stack Developer",
        photo: hassanPhoto,
        github: "https://github.com/Hassan01SE",
        linkedin: "https://www.linkedin.com/in/hassansohail-software-engineer/",
        mail: "hassansohail.se2001@gmail.com",
    },
    {
        name: "Jamal Khan",
        role: "ML Developer",
        photo: jamalPhoto,
        github: "https://github.com/Jamal-Ahmed-Khan",
        linkedin: "https://www.linkedin.com/in/jamal-ahmed-khan-619409117",
        mail: "jamalaksuarez@gmail.com",
    },
];

const About = () => (
    <>
        <section className="border-b border-white/10">
            <div className="page max-w-4xl py-16 lg:py-20">
                <p className="eyebrow">Our aim</p>
                <blockquote className="mt-4 text-2xl font-medium leading-relaxed text-slate-100 sm:text-3xl">
                    “To use artificial intelligence and deep learning to enhance medical imaging, supporting more accurate
                    diagnoses and better patient outcomes.”
                </blockquote>
                <p className="mt-4 text-slate-400">The SuperRay team, NED University of Engineering and Technology</p>
            </div>
        </section>

        <section className="border-b border-white/10 py-16 lg:py-20" aria-labelledby="problems-heading">
            <div className="page">
                <p className="eyebrow">Motivation</p>
                <h2 id="problems-heading" className="mt-3 text-3xl font-semibold tracking-tight">Problems SuperRay addresses</h2>
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {problems.map((problem) => (
                        <article key={problem.title} className="card overflow-hidden">
                            <Image src={problem.image} alt="" className="aspect-[4/3] w-full object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
                            <div className="p-5">
                                <h3 className="font-semibold">{problem.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-400">{problem.body}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-16 lg:py-20" aria-labelledby="team-heading">
            <div className="page">
                <p className="eyebrow">Team</p>
                <h2 id="team-heading" className="mt-3 text-3xl font-semibold tracking-tight">The people behind SuperRay</h2>
                <ul className="mt-10 grid gap-6 sm:grid-cols-3">
                    {team.map((member) => (
                        <TeamMember key={member.name} member={member} />
                    ))}
                </ul>
            </div>
        </section>
    </>
);

export default About;
