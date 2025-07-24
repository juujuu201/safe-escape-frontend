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
}