import axios from "axios";

// Axios 인스턴스 생성
const ApiClient = axios.create({
    baseURL: "https://terrapin-fresh-haddock.ngrok-free.app/admin",
    timeout: 5000
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
    response => {
        return response.data;
    },
    error => {
        if (error.response) {
            console.error("API Error:", error.response.status, error.response.data);

            if (error.response.status === 401) {
                // 인증 실패 시 처리 (로그아웃, 리다이렉트 등)
                console.warn("로그인 만료됨. 다시 로그인해주세요.");
            }
        } else {
            console.error("Network Error:", error.message);
        }

        return Promise.reject(error);
    }
);

export default ApiClient;