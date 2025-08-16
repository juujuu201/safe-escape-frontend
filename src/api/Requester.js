import ApiClient from "./ApiClient";
import Util from "../common/Utils";

export const doLogin = (email, password) => {
    return ApiClient.post("/auth/login", {email, password});
};

export const doLogout = () => {
    return ApiClient.post("/auth/logout");
};

export const doRefresh = (refreshToken) => {
    return ApiClient.post("/auth/refresh", {refreshToken});
};

export const saveCrowdedArea = (edgeModels, exitModels) => {
    if (!(edgeModels?.length > 0 && exitModels?.length > 0)) {
        return;
    }

    const crowdedLocationList = [],
        exitLocationList = [];

    for (const edge of edgeModels) {
        const position = edge.position;

        crowdedLocationList.push({
            latitude: position.lat(),
            longitude: position.lng()
        });
    }

    for (const exit of exitModels) {
        const position = exit.position;

        exitLocationList.push({
            latitude: position.lat(),
            longitude: position.lng()
        });
    }

    return ApiClient.post("/crowded-area", {crowdedLocationList, exitLocationList})
};

export const deleteCrowdedArea = (crowdedId) => {
    if (!crowdedId) {
        return;
    }

    return ApiClient.delete(`/crowded-area/${crowdedId}`);
};

export const getNearbyShelter = (exitId) => {
    if (!exitId) {
        return;
    }

    return ApiClient.get(`/exits/${exitId}/shelter/nearby`);
}

export const getCrowdedInfo = (mapBounds) => {
    let locationList = [];

    if (Util.isEmptyObject(mapBounds)) {
        return null;
    }

    for (const coord of Object.values(mapBounds)) {
        locationList.push(`latitudes=${coord.lat()}&longitudes=${coord.lng()}`);
    }

    return ApiClient.get(`/main?${locationList.join("&")}`);
}