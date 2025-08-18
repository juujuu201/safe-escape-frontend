import axios from "axios";
import Define from "../common/Define.js";
import Constants from "../common/Constants.js";

// Axios 인스턴스 생성
const ApiClient = axios.create({
    baseURL: Define.BASE_URL,
    timeout: 30000,
    headers: {
        "ngrok-skip-browser-warning": true
    }
});

function _doRefresh(refreshToken) {
    return requestWrapper(ApiClient.post(
        "/auth/refresh",
        {},
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`
            }
        }));
}

// 요청 인터셉터
ApiClient.interceptors.request.use(
    config => {
        if (config.baseURL === Define.BASE_URL) {
            const token = localStorage.getItem("accessToken");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        if (config.method && config.method.toLowerCase() !== "get") {
            config.headers["Content-Type"] = "application/json";
        }

        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터
ApiClient.interceptors.response.use(
    response => response.data,
    async error => {
        if (error.response) {
            const {status, data, config} = error.response;

            console.error("API Error:", status, data);

            if (status === 403 && data?.code === "EXPIRED_JWT") {
                try {
                    const refreshToken = localStorage.getItem("refreshToken"),
                        {code, data} = await _doRefresh(refreshToken);

                    if (code === Constants.RESPONSE_CODE.OK) {
                        const newAccessToken = data.accessToken;

                        localStorage.setItem("accessToken", newAccessToken);

                        // 원래 요청 다시 실행
                        config.headers.Authorization = `Bearer ${newAccessToken}`;
                        return ApiClient(config);
                    }
                } catch (refreshError) {
                    if (refreshError.response?.data?.code === "EXPIRED_REFRESH_TOKEN") {
                        localStorage.clear();
                        window.location.href = "/";
                    }
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// 공통 wrapper
export const requestWrapper = async (axiosPromise) => {
    try {
        const response = await axiosPromise,
            {code, data} = response;

        return {
            code: code,
            data
        };
    } catch (error) {
        return {
            code: false,
            error
        };
    }
};

export default ApiClient;