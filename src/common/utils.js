import Constants from "./constants.js";

export default class Util {
    /**
     * 네이버 지도 위치 객체를 만들어 반환한다.
     * @param {Object} coordinateInfo       - 위도, 경도 값이 들어있는 위치 정보 object
     * @param {Map} mapObj       - 네이버 지도 객체
     * @returns {Map.maps.LatLng|null}
     */
    static getLocationObj(coordinateInfo, mapObj = window.naver) {
        if (this.isEmptyObject(coordinateInfo)) {
            return null;
        }

        const {latitude, longitude} = coordinateInfo,
            locationObj = null;

        if (!mapObj) {
            return locationObj;
        }

        return new mapObj.maps.LatLng(latitude, longitude);
    }

    /**
     * 빈 object인지 여부를 반환한다.
     * @param {Object} obj
     */
    static isEmptyObject(obj) {
        let result = false;

        if (!obj && !(typeof obj === "object" && Object.keys(obj)?.length > 0)) {
            result = true;
        }

        return result;
    }

    static getDistanceBetweenCoord(coord1, coord2) {
        if (!(coord1 && coord2)) {
            return null;
        }

        const lat1 = coord1.lat(),
            lon1 = coord1.lng(),
            lat2 = coord2.lat(),
            lon2 = coord2.lng();
        let result = null;

        if (lat1 != null && lon1 != null && lat2 != null && lon2 != null) {
            const dLat = (lat2 - lat1) * Math.PI / 180,
                dLon = (lon2 - lon1) * Math.PI / 180,
                haversine =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) *
                    Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2),
                centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

            result = Constants.EARTH_R * centralAngle;
        }

        return result;
    }
}