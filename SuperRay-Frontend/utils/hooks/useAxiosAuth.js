'use client';
import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { axiosAuth } from "../axios";

const useAxiosAuth = () => {
    const { data: session, update } = useSession();

    useEffect(() => {
        if (session?.error === "RefreshAccessTokenError") {
            signOut({ callbackUrl: "/login" });
        }
    }, [session?.error]);

    useEffect(() => {
        const requestIntercept = axiosAuth.interceptors.request.use((config) => {
            if (session?.accessToken && !config.headers.Authorization) {
                config.headers.Authorization = `JWT ${session.accessToken}`;
            }
            return config;
        });

        // tokens are refreshed in the nextauth jwt callback, so on 401 call update() and retry once
        const responseIntercept = axiosAuth.interceptors.response.use(
            (response) => response,
            async (error) => {
                const request = error.config;
                if (error.response?.status === 401 && request && !request._retried) {
                    request._retried = true;
                    const refreshed = await update();
                    if (refreshed?.accessToken && !refreshed.error) {
                        request.headers.Authorization = `JWT ${refreshed.accessToken}`;
                        return axiosAuth(request);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axiosAuth.interceptors.request.eject(requestIntercept);
            axiosAuth.interceptors.response.eject(responseIntercept);
        };
    }, [session, update]);

    return axiosAuth;
};

export default useAxiosAuth;
