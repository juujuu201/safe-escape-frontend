import {appModel, CongestionModel, MarkerModel, PolygonModel} from "../model/AppModel.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import Resources from "../common/Resources.js";
import Constants from "../common/Constants.js";
import * as Requester from "../api/Requester";

const _naverMap = window.naver,
    _statusType = Constants.STATUS_TYPE,
    _tabNames = Constants.MENU_NAMES;

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

    static setSelectedExit(e, markerModel) {
        const {status, selectedExit} = appModel;
        // TODO: 삭제 예정
        const testModel = new MarkerModel({
            position: Util.getLocationObj(Define.DEFAULT_LOCATION, window.naver),
            naverMap: window.naver,
            map: appModel.map
        });

        if (selectedExit) {
            selectedExit.deSelect();
        }

        appModel.setValue("selectedExit", markerModel);

        if (appModel.isSelectedStatus()) {
            const targetModel = (status === _statusType.EXIT_SELECTED) ? testModel : appModel.selectedShelter;

            if (markerModel && targetModel) {
                AppController.calcWalkingDistance(markerModel, targetModel);
            }
        } else {
            appModel.setValue("status", _statusType.EXIT_SELECTED);
        }
    }

    static setCrowdedInfo(map, mapBounds) {
        if (!mapBounds) {
            return;
        }

        const locationList = [],
            {selectedTab, markerTooltipModel, selectedShelter} = appModel;
        let crowdedInfo;

        appModel.setValue("mapBounds", mapBounds);

        // 정보 불러오기
        // crowdedInfo = Requester.getCrowdedInfo(mapBounds);
        crowdedInfo = {
            "code": "ok",
            "data": {
                "populationList": [
                    {
                        "latitude": 37.5668876,
                        "longitude": 126.9817638,
                        "level": "CROWDED"
                    },
                    {
                        "latitude": 37.439369,
                        "longitude": 127.005608,
                        "level": "VERY_CROWDED"
                    },
                    {
                        "latitude": 37.511190,
                        "longitude": 126.995815,
                        "level": "NORMAL"
                    },
                    {
                        "latitude": 37.517195,
                        "longitude": 127.025203,
                        "level": "FREE"
                    },
                    {
                        "latitude": 37.576557,
                        "longitude": 126.976794,
                        "level": "VERY_CROWDED"
                    }
                ],
                "crowdedAreaList": [
                    {
                        "id": 10,
                        "locationList": [
                            {"latitude": 37.572512, "longitude": 126.9761566},
                            {"latitude": 37.5685662, "longitude": 126.9618229},
                            {"latitude": 37.5610144, "longitude": 126.9580892},
                            {"latitude": 37.5593474, "longitude": 126.9828514},
                            {"latitude": 37.5585309, "longitude": 126.9898037},
                            {"latitude": 37.5656068, "longitude": 126.9935802}
                        ],
                        "exitList": [
                            {"latitude": 37.5656068, "longitude": 126.9851688},
                            {"latitude": 37.5600618, "longitude": 126.9872288},
                            {"latitude": 37.5635317, "longitude": 126.9644407}
                        ]
                    }
                ],
                "shelterList": [
                    {
                        "id": 1608,
                        "name": "덕수초등학교 운동장",
                        "address": "서울특별시 중구 덕수궁길 140(정동) 덕수초등학교 운동장",
                        "latitude": 37.568468,
                        "longitude": 126.974526
                    }
                ]
            }
        };

        if (crowdedInfo?.data) {
            const {populationList, crowdedAreaList, shelterList} = crowdedInfo.data,
                markerModels = [];

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
                        edgeList = [];
                    let polygonModel;

                    for (const location of locationList) {
                        const {latitude, longitude} = location;

                        edgeList.push(Util.getLocationObj({
                            latitude,
                            longitude
                        }));
                    }

                    for (const exit of exitList) {
                        const {latitude, longitude} = exit,
                            exitModel = new MarkerModel({
                                map,
                                naverMap: _naverMap,
                                position: Util.getLocationObj({latitude, longitude}),
                                icon: `${Constants.IMAGE_URL}exit_marker.svg`,
                                onClick: (e) => {
                                    if (selectedTab !== _tabNames.CONGESTION) {
                                        appModel.setValue("selectedTab", _tabNames.CONGESTION);
                                    }

                                    if (selectedShelter) {
                                        selectedShelter.deSelect("selectedShelter");
                                    }

                                    if (markerTooltipModel.isVisible) {
                                        markerTooltipModel.hide();
                                    }

                                    this.setSelectedExit(e, exitModel);
                                }
                            });

                        exitModels.push(exitModel);
                        markerModels.push(exitModel);
                    }

                    polygonModel = new PolygonModel({
                        map,
                        naverMap: _naverMap,
                        pathList: edgeList,
                        markers: exitModels,
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

                appModel.setValue("polygonModels", polygonModels);
            }

            if (shelterList.length > 0) {
                const shelterModels = [];

                for (const shelter of shelterList) {
                    const {id, name, address, latitude, longitude} = shelter,
                        shelterModel = new MarkerModel({
                            position: Util.getLocationObj({latitude, longitude}, _naverMap),
                            title: name,
                            desc: address,
                            onClick: (e, markerModel) => {
                                appModel.setValue("selectedShelter", markerModel);

                                if (appModel.status === _statusType.EXIT_SELECTED) {
                                    appModel.setValue("status", _statusType.EXIT_SHELTER_SELECTED);
                                } else {
                                    appModel.markerTooltipModel.show(markerModel);
                                }
                            },
                            map,
                            naverMap: _naverMap
                        });

                    shelterModels.push(shelterModel);
                    markerModels.push(shelterModel);
                }

                appModel.setValue("shelterModels", shelterModels);
            }

            appModel.setValue("markerModels", markerModels);
        }
    }
}