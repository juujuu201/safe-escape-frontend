import ApiClient, {requestWrapper} from "./ApiClient";
import Util from "../common/Utils";

export const doLogin = (email, password) => {
    return requestWrapper(ApiClient.post("/auth/login", {email, password}));
};

export const doLogout = () => {
    return requestWrapper(ApiClient.post("/auth/logout"));
};

export const doRefresh = (refreshToken) => {
    return requestWrapper(ApiClient.post("/auth/refresh", {refreshToken}));
};

export const saveCrowdedArea = (edgeList, exitModels) => {
    if (!(edgeList?.length > 0 && exitModels?.length > 0)) {
        return;
    }

    const crowdedLocationList = [],
        exitLocationList = [];
    let resultObj = {};

    for (const edge of edgeList) {
        crowdedLocationList.push({
            latitude: String(edge.lat()),
            longitude: String(edge.lng())
        });
    }

    for (const exit of exitModels) {
        const position = exit.position;

        exitLocationList.push({
            latitude: String(position.lat()),
            longitude: String(position.lng())
        });
    }

    resultObj = {
        crowdedLocationList,
        exitLocationList
    };

    return requestWrapper(ApiClient.post("/crowded-area", resultObj));
};

export const deleteCrowdedArea = (crowdedId) => {
    if (!crowdedId) {
        return;
    }

    return requestWrapper(ApiClient.delete(`/crowded-area/${crowdedId}`));
};

export const getNearbyShelter = (exitId) => {
    if (!exitId) {
        return;
    }

    return requestWrapper(ApiClient.get(`/exits/${exitId}/shelter/nearby`));
}

export const getCrowdedInfo = (mapBounds) => {
    let locationList = [];

    if (Util.isEmptyObject(mapBounds)) {
        return null;
    }

    for (const coord of Object.values(mapBounds)) {
        locationList.push(`latitudes=${coord.lat()}&longitudes=${coord.lng()}`);
    }

    return requestWrapper(ApiClient.get(`/main?${locationList.join("&")}`));
}