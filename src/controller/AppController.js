import {appModel, CongestionModel, MarkerModel, PolygonModel} from "../model/AppModel.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import Resources from "../common/Resources.js";
import Constants from "../common/Constants.js";
import * as Requester from "../api/Requester";

const _naverMap = window.naver,
    _statusType = Constants.STATUS_TYPE,
    _tabNames = Constants.MENU_NAMES,
    _responseCode = Constants.RESPONSE_CODE;

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
                    "appKey": process.env.REACT_APP_TMAP_API_KEY
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

        fetch(Define.TMAP_API_URL, options)
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

            if (appModel.selectedExit !== startMarkerModel) {
                appModel.setValue("selectedExit", startMarkerModel);
            }

            if (appModel.selectedShelter !== targetMarkerModel) {
                appModel.setValue("selectedShelter", targetMarkerModel);
            }

            startMarkerModel.select();
            targetMarkerModel.select();
        })
        .catch(err => console.error(err));
    }

    static async setSelectedExit(e, markerModel) {
        const {status, selectedExit} = appModel;

        if (selectedExit) {
            selectedExit.deSelect();
        }

        appModel.setValue("selectedExit", markerModel);

        if (appModel.isSelectedStatus()) {
            let targetModel;

            if (status === _statusType.EXIT_SELECTED) {
                const {code, data} = await Requester.getNearbyShelter(markerModel.id);

                if (code === _responseCode.OK) {
                    appModel.routeInfo?.endMarker?.deSelect();
                    targetModel = appModel.getShelterModel(data.id);
                }
            } else if (status === _statusType.EXIT_SHELTER_SELECTED) {
                appModel.removeRoutes(true, false);
                targetModel = appModel.selectedShelter;
            }

            if (markerModel && targetModel) {
                AppController.calcWalkingDistance(markerModel, targetModel);
            }
        } else {
            appModel.setValue("status", _statusType.EXIT_SELECTED);
        }
    }

    static async setCrowdedInfo(map) {
        const {selectedTab, markerTooltipModel, shelterModels, polygonModels, congestionModels} = appModel,
            mapBounds = Util.getVisibleBounds(map),
            {code, data} = await Requester.getCrowdedInfo(mapBounds);

        if (code === _responseCode.OK) {
            const {populationList, crowdedAreaList, shelterList} = data;

            // 기존에 표시되고 있던 마커/폴리곤/혼잡 영역 제거
            if (polygonModels) {
                appModel.removePolygon();
            }

            if (shelterModels) {
                appModel.removeShelter();
            }

            if (congestionModels) {
                appModel.removeCongestion();
            }

            // 지도 영역 지정
            appModel.setValue("mapBounds", mapBounds);

            if (populationList.length > 0) {
                const congestionModels = [];

                for (const population of populationList) {
                    const {latitude, longitude, level} = population,
                        congestionModel = new CongestionModel({
                            position: Util.getLocationObj({latitude, longitude}, _naverMap),
                            level,
                            map,
                            naverMap: _naverMap
                        });

                    congestionModels.push(congestionModel);
                }

                appModel.setValue("congestionModels", congestionModels);
            }

            if (crowdedAreaList.length > 0) {
                const polygonModels = [],
                    exitModels = [];

                for (const crowdedArea of crowdedAreaList) {
                    const {locationList, exitList} = crowdedArea,
                        polygonId = crowdedArea.id,
                        edgeList = [],
                        markers = [];
                    let polygonModel;

                    for (const location of locationList) {
                        const {latitude, longitude} = location;

                        edgeList.push(Util.getLocationObj({
                            latitude,
                            longitude
                        }));
                    }

                    for (const exit of exitList) {
                        const {id, latitude, longitude} = exit,
                            exitModel = new MarkerModel({
                                id,
                                map,
                                naverMap: _naverMap,
                                position: Util.getLocationObj({latitude, longitude}),
                                icon: `${Constants.IMAGE_URL}exit_marker.svg`,
                                onClick: (e) => {
                                    if (selectedTab !== _tabNames.CONGESTION) {
                                        appModel.setValue("selectedTab", _tabNames.CONGESTION);
                                    }

                                    if (markerTooltipModel.isVisible) {
                                        markerTooltipModel.hide();
                                    }

                                    this.setSelectedExit(e, exitModel);
                                }
                            });

                        markers.push(exitModel);
                        exitModels.push(exitModel);
                    }

                    polygonModel = new PolygonModel({
                        id: polygonId,
                        map,
                        naverMap: _naverMap,
                        pathList: edgeList,
                        markers,
                        onClick: (e, model) => {
                            if (selectedTab !== _tabNames.CONGESTION) {
                                appModel.setValue("selectedTab", _tabNames.CONGESTION);
                            }

                            if (!appModel.isSettingStatus()) {
                                appModel.setValue("selectedPolygon", model);
                                appModel.setValue("status", _statusType.CONGESTION_SELECTED);
                            }
                        }
                    });

                    polygonModels.push(polygonModel);
                }

                appModel.setValue("exitModels", exitModels);
                appModel.setValue("polygonModels", polygonModels);
            }

            if (shelterList.length > 0) {
                const shelterModels = [];

                for (const shelter of shelterList) {
                    const {id, name, address, latitude, longitude} = shelter,
                        shelterModel = new MarkerModel({
                            id,
                            position: Util.getLocationObj({latitude, longitude}, _naverMap),
                            title: name,
                            desc: address,
                            onClick: (e, markerModel) => {
                                if (appModel.selectedShelter) {
                                    appModel.selectedShelter.deSelect("selectedShelter");
                                }

                                appModel.removeRoutes(false);
                                appModel.markerTooltipModel.hide();
                                appModel.setValue("selectedShelter", markerModel);

                                if (appModel.status === _statusType.EXIT_SELECTED) {
                                    appModel.setValue("status", _statusType.EXIT_SHELTER_SELECTED);
                                } else if (appModel.status === _statusType.EXIT_SHELTER_SELECTED) {
                                    this.calcWalkingDistance(appModel.selectedExit, markerModel);
                                } else {
                                    appModel.markerTooltipModel.show(markerModel);
                                }
                            },
                            map,
                            naverMap: _naverMap
                        });

                    shelterModels.push(shelterModel);
                }

                appModel.setValue("shelterModels", shelterModels);
            }
        }
    }
}