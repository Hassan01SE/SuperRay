import Image from "next/image";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";

const TeamMember = ({ member }) => {
    const links = [
        { label: "GitHub", href: member.github, icon: FaGithub },
        { label: "LinkedIn", href: member.linkedin, icon: FaLinkedin },
        { label: "Email", href: `mailto:${member.mail}`, icon: FaEnvelope },
    ];

    return (
        <li className="card flex flex-col items-center p-6 text-center">
            <Image src={member.photo} alt={member.name} className="h-28 w-28 rounded-full object-cover ring-2 ring-brand/50" sizes="112px" />
            <h3 className="mt-4 font-semibold">{member.name}</h3>
            <p className="text-sm text-slate-400">{member.role}</p>
            <ul className="mt-4 flex gap-2">
                {links.map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                        <a
                            href={href}
                            target={href.startsWith("mailto:") ? undefined : "_blank"}
                            rel="noopener noreferrer"
                            className="btn-ghost px-2.5"
                            aria-label={`${member.name} on ${label}`}
                        >
                            <Icon className="text-lg" aria-hidden="true" />
                        </a>
                    </li>
                ))}
            </ul>
        </li>
    );
};

export default TeamMember;
