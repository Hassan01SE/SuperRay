import { Spinner } from "@nextui-org/react";

const Loading = () => (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
        <Spinner size="lg" color="primary" label="Loading..." classNames={{ label: "text-slate-300" }} />
    </div>
);

export default Loading;
