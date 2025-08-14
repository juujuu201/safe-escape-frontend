import {appModel} from "../model/AppModel.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import Resources from "../common/Resources.js";
import Constants from "../common/Constants.js";

const _naverMap = window.naver;

export default class AppController {
    static closeMapTooltip(centerModel = appModel.centerModel) {
        const markerTooltipModel = appModel.markerTooltipModel;

        if (markerTooltipModel) {
            markerTooltipModel.hide();
        }

        if (centerModel) {
            centerModel.deSelect();
        }
    }

    static cancelCongestionSetting(map, isDeleteAll = false) {
        if (!map) {
            return;
        }

        // 혼잡 지역 설정 중 폴리곤을 지운다.
        for (const model of appModel.tempEdgeModels) {
            model.hide();
        }

        if (appModel.tempPolygonModel) {
            appModel.tempPolygonModel.polygon?.setMap(null);
        }

        appModel.setValue("tempEdgeModels", []);
        appModel.setValue("tempPolygonModel", null);

        // 비상구 설정 중 표시하던 마커를 지운다.
        if (isDeleteAll) {
            for (const model of appModel.tempExitModels) {
                model.hide();
            }
        }

        appModel.setValue("tempExitModels", []);
    }

    static cancelExitSetting(map, isDeletePolygon = false) {
        if (!map) {
            return;
        }

        // 혼잡 지역 설정 중 표시하던 마커와 폴리곤을 지운다.
        for (const model of appModel.tempExitModels) {
            model.hide();
        }

        if (isDeletePolygon && appModel.tempPolygonModel) {
            appModel.tempPolygonModel.polygon?.setMap(null);
        }

        appModel.setValue("tempExitModels", []);
        appModel.setValue("tempEdgeModels", []);
        appModel.setValue("tempPolygonModel", null);
    }

    static calcWalkingDistance(startMarkerModel, targetMarkerModel) {
        if (!(startMarkerModel && targetMarkerModel)) {
            return;
        }

        const markerTooltipModel = appModel.markerTooltipModel;

        // 표시하고 있던 경로가 있다면 삭제한다.
        appModel.removeRoutes();

        const startPos = startMarkerModel.position,
            endPos = targetMarkerModel.position,
            options = {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "appKey": Define.TMAP_APP_KEY
                },
                body: JSON.stringify({
                    startX: startPos.lng(),
                    startY: startPos.lat(),
                    endX: endPos.lng(),
                    endY: endPos.lat(),
                    speed: Define.WALKING_SPEED,
                    searchOption: Define.SEARCH_OPTION,
                    reqCoordType: Define.REQ_COORD_TYPE,
                    resCoordType: Define.RES_COORD_TYPE,
                    startName: Define.START_NAME,
                    endName: Define.END_NAME
                })
            };

        fetch(Define.REQUEST_URL, options)
            .then(res => res.json())
            .then(res => {
                const fullRoutes = res.features;
                let routeLines = [],
                    totalDistance = 0,
                    totalTime = 0;

                for (const [idx, route] of fullRoutes.entries()) {
                    const {type, coordinates} = route.geometry;
                    let path;

                    if (idx === 0 || idx === fullRoutes.length - 1) {
                        const targetModel = (idx === 0) ? startMarkerModel : targetMarkerModel;

                        path = [
                            targetModel.position,
                            Util.getLocationObj({
                                latitude: coordinates[1],
                                longitude: coordinates[0]
                            })
                        ];
                    } else if (type === "LineString") {
                        const {distance, time} = route.properties;

                        path = coordinates.map(coord => Util.getLocationObj({latitude: coord[1], longitude: coord[0]}));

                        // 총 거리/시간 계산
                        totalDistance += distance;
                        totalTime += time;
                    }

                    // 경로 표시
                    if (path) {
                        routeLines.push(new _naverMap.maps.Polyline({
                            map: appModel.map,
                            path,
                            strokeColor: Constants.COLORS.RED,
                            strokeOpacity: 0.8,
                            strokeWeight: 3
                        }));
                    }
                }

                if (totalDistance > 0) {
                    totalDistance = totalDistance / 1000;
                }

                if (totalTime > 0) {
                    totalTime = Math.floor(totalTime / 60);
                }

                // 총 거리/시간 툴팁에 표시
                startMarkerModel.setValue("desc", Util.replaceResource(Resources.DISTANCE_TIME_MSG, {
                    distance: String(totalDistance),
                    time: String(totalTime)
                }));

                if (markerTooltipModel.isVisible) {
                    markerTooltipModel.move(startMarkerModel);
                } else {
                    markerTooltipModel.show(startMarkerModel, true);
                }

                appModel.setValue("routeInfo", {
                    totalDistance,
                    totalTime,
                    routeLines,
                    startMarker: startMarkerModel,
                    endMarker: targetMarkerModel
                });

                startMarkerModel.select();
                targetMarkerModel.select();
            })
            .catch(err => console.error(err));
    }
}