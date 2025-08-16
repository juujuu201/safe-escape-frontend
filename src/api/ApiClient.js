import axios from "axios";

// Axios 인스턴스 생성
const ApiClient = axios.create({
    baseURL: "https://terrapin-fresh-haddock.ngrok-free.app/admin",
    timeout: 30000,
    headers: {
        "ngrok-skip-browser-warning": true
    }
});

// 요청 인터셉터
ApiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
    error => {
        if (error.response) {
            console.error("API Error:", error.response.status, error.response.data);

            if (error.response.status === 401) {
                console.warn("로그인 만료");
            }
        } else {
            console.error("Network Error:", error.message);
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