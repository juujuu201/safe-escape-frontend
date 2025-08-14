import Constants from "./Constants.js";

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

        if (!obj || (typeof obj === "object" && Object.keys(obj)?.length === 0)) {
            result = true;
        }

        return result;
    }

    /**
     * 두 좌표 간 직선 거리를 계산한다.
     * @param {Object} coord1
     * @param {Object} coord2
     * @returns {Number}
     */
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

    /**
     * 중심점을 기준으로 각도 값을 정렬한 배열을 반환한다.
     * @param {Array} points            - 각도 값 배열
     * @returns {Array}
     */
    static sortPointsClockwise(points) {
        if (points.length < 3) {
            return points;
        }

        const len = points.length;
        let latSum = 0,
            lngSum = 0,
            centerLat, centerLng;

        for (const point of points) {
            latSum += point.lat();
            lngSum += point.lng();
        }

        centerLat = latSum / len;
        centerLng = lngSum / len;

        return [...points].sort((firstPoint, secondPoint) => {
            const firstAngle = Math.atan2(firstPoint.lat() - centerLat, firstPoint.lng() - centerLng),
                secondAngle = Math.atan2(secondPoint.lat() - centerLat, secondPoint.lng() - centerLng);

            return firstAngle - secondAngle;
        });
    }

    static isContainsCoord(coord, pathList) {
        if (this.isEmptyObject(coord) || pathList?.length < 1) {
            return false;
        }

        const x = coord.lng(),
            y = coord.lat(),
            pathListLen = pathList.length;
        let isContains = false;

        for (let i = 0, j = pathListLen - 1; i < pathListLen; j = i++) {
            const xi = pathList[i].lng(),
                yi = pathList[i].lat(),
                xj = pathList[j].lng(),
                yj = pathList[j].lat();
            let intersect;

            if (!!xi && !!yi && !!xj && !!yj) {
                intersect = (yi > y !== yj > y)
                    && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi);
            }

            if (intersect) {
                isContains = !isContains;
            }
        }

        return isContains;
    }

    static addClass(el, className) {
        if (el && typeof className === "string") {
            el.classList.add(className);
        }
    }

    static removeClass(el, className) {
        if (el && typeof className === "string") {
            el.classList.remove(className);
        }
    }

    static hasClass(el, className) {
        if (!(el && typeof className === "string")) {
            return false;
        }

        return el.classList.contains(className);
    }

    static replaceResource(resource, variables) {
        return resource.replace(/\$\{([^}]+)\}/g, (_, key) => {
            key = key.trim();
            return variables.hasOwnProperty(key) ? variables[key] : "";
        });
    }
}