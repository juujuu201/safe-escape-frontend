import {useEffect, useRef, useState} from "react";
import {useModel} from "../controller/UseModel.js";
import Constants from "../common/Constants.js";
import Resources from "../common/Resources.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import {appModel, MenuButtonModel} from "../model/AppModel.js";
import {SEMessageBar, SETextButton} from "../widgets/Widgets.js";
import AppController from "../controller/AppController.js";
import * as Requester from "../api/Requester.js";

const _viewNames = Constants.VIEW_NAMES,
    _menuNames = Constants.MENU_NAMES,
    _congestionButtonValues = Constants.CONGESTION_BUTTON_VALUES,
    _statusType = Constants.STATUS_TYPE,
    _mapMoveEnableOptions = Define.MAP_MOVE_ENABLE_OPTIONS,
    _responseCode = Constants.RESPONSE_CODE,
    _defaultButtonGroup = [
        _congestionButtonValues.SET_CONGESTION,
        _congestionButtonValues.WALKING_DISTANCE,
        _congestionButtonValues.FIND_SHELTER,
        _congestionButtonValues.RECOMMEND_EXIT
    ],
    _menuButtonGroup = {
        [`${_statusType.NONE}`]: _defaultButtonGroup,
        [`${_statusType.CONGESTION_SETTING}`]: [
            _congestionButtonValues.CANCEL_CONGESTION_SETTING,
            _congestionButtonValues.SET_EXIT
        ],
        [`${_statusType.EXIT_SETTING}`]: [
            _congestionButtonValues.RESET_EXIT,
            _congestionButtonValues.FINISH_EXIT
        ],
        [`${_statusType.CONGESTION_SELECTED}`]: [..._defaultButtonGroup, ...[_congestionButtonValues.DELETE_CONGESTION]],
        [`${_statusType.EXIT_SELECTED}`]: _defaultButtonGroup,
        [`${_statusType.EXIT_SHELTER_SELECTED}`]: _defaultButtonGroup
    };

export const CongestionSideBarView = () => {
    const status = useModel(appModel, "status"),
        messageValue = useModel(appModel, "messageValue"),
        [visibleModels, setVisibleModels] = useState([]),
        isSettingStatus = appModel.isSettingStatus(),
        ref = useRef(null);

    function _onCancelSelection() {
        if (isSettingStatus) {
            const map = appModel.map;

            AppController.cancelCongestionSetting(map, true);
            map.setOptions(Define.MAP_MOVE_ENABLE_OPTIONS);
            appModel.setValue("status", Constants.STATUS_TYPE.NONE);
        } else if (status === _statusType.CONGESTION_SELECTED) {
            const selectedPolygon = appModel.selectedPolygon;

            if (selectedPolygon) {
                const target = selectedPolygon.element;

                if (target) {
                    Util.removeClass(target, Constants.SELECTED_CLASS);
                }

                for (const marker of selectedPolygon.markers) {
                    const priorityEl = marker.priorityEl;

                    if (priorityEl) {
                        priorityEl.remove();
                    }
                }
                appModel.setValue("selectedPolygon", null);
            }

            appModel.setValue("status", _statusType.NONE);
        } else if (status === _statusType.EXIT_SELECTED) {
            const {markerTooltipModel} = appModel;

            appModel.removeRoutes();
            markerTooltipModel.hide();

            appModel.setValue("selectedExit", null);
            appModel.setValue("status", _statusType.NONE);
        } else if (status === _statusType.EXIT_SHELTER_SELECTED) {
            const {markerTooltipModel} = appModel;

            markerTooltipModel.hide();
            appModel.removeRoutes();

            appModel.setValue("selectedExit", null);
            appModel.setValue("selectedShelter", null);
            appModel.setValue("status", _statusType.NONE);
        }
    }

    useEffect(() => {
        const buttonModels = [];

        for (const [key, value] of Object.entries(_congestionButtonValues)) {
            const model = new MenuButtonModel({
                desc: Resources[key],
                value
            });

            buttonModels.push(model);
        }

        appModel.setValue("menuButtonModels", buttonModels);
    }, []);

    useEffect(() => {
        const menuButtonGroup = _menuButtonGroup[status];

        if (status && menuButtonGroup) {
            const nextVisibleModels = [];

            for (const model of appModel.menuButtonModels) {
                const value = model.value,
                    isVisible = (menuButtonGroup.indexOf(value) !== -1);
                let isDisable = true,
                    messageValue = "";

                if (model.isVisible !== isVisible) {
                    model.setValue("isVisible", isVisible);
                }

                if (isVisible) {
                    switch(status) {
                        case _statusType.CONGESTION_SETTING:
                            if (value === _congestionButtonValues.CANCEL_CONGESTION_SETTING) {
                                isDisable = false;
                            }
                            messageValue = Resources.SETTING_CONGESTION_AREA;
                            break;
                        case _statusType.EXIT_SETTING:
                            if (value === _congestionButtonValues.RESET_EXIT) {
                                isDisable = false;
                            }
                            messageValue = Resources.SETTING_EXIT;
                            break;
                        case _statusType.CONGESTION_SELECTED:
                            if (value === _congestionButtonValues.RECOMMEND_EXIT || value === _congestionButtonValues.DELETE_CONGESTION) {
                                isDisable = false;
                            }
                            messageValue = Resources.SELECTED_CONGESTION;
                            break;
                        case _statusType.EXIT_SELECTED:
                            if (value === _congestionButtonValues.FIND_SHELTER) {
                                isDisable = false;
                            }
                            messageValue = Resources.SELECTED_EXIT;
                            break;
                        case _statusType.EXIT_SHELTER_SELECTED:
                            if (value === _congestionButtonValues.WALKING_DISTANCE) {
                                isDisable = false;
                            }
                            messageValue = Resources.SELECTED_EXIT_SHELTER;
                            break;
                        case _statusType.NONE:
                            if (value === _congestionButtonValues.SET_CONGESTION) {
                                isDisable = false;
                            }
                            break;
                    }

                    if (model.isDisabled !== isDisable) {
                        model.setValue("isDisabled", isDisable);
                    }

                    appModel.setValue("messageValue", messageValue);

                    nextVisibleModels.push(model);
                }
            }

            setVisibleModels(nextVisibleModels);
        }
    }, [status]);

    useEffect(() => {
        if (ref.current) {
            appModel.setValue("sideBarRef", ref);
        }
    }, [ref]);

    return (
        <div className={Constants.CONGESTION_MENU_AREA_CLASS}>
            <SEMessageBar desc={messageValue} isVisible={!!messageValue} onButtonClick={_onCancelSelection}
                          buttonDesc={Resources[isSettingStatus ? "CANCEL_SETTING" : "CANCEL_SELECTION"]}/>
            <div className={`${_menuNames.CONGESTION} ${_viewNames.SIDE_BAR}`} ref={ref}>
                {visibleModels.map(model =>
                    <CongestionMenuButton key={model.value} model={model}/>)}
            </div>
        </div>
    );
};

const CongestionMenuButton = (props) => {
    const {model} = props,
        {value, desc} = model,
        map = useModel(appModel, "map"),
        isVisible = useModel(model, "isVisible"),
        isDisabled = useModel(model, "isDisabled");

    async function _onClick(e) {
        let isEnableMap = false,
            status, selectedExit;

        switch (value) {
            // 혼잡 지역 설정하기
            case _congestionButtonValues.SET_CONGESTION: {
                status = _statusType.CONGESTION_SETTING;

                // 혼잡 지역을 설정하는 동안 지도를 움직이지 못하도록 설정한다.
                if (map) {
                    const mapOptions = Object.fromEntries(
                        Object.entries(_mapMoveEnableOptions).map(([key, value]) => [key, !value])
                    );

                    if (!Util.isEmptyObject(mapOptions)) {
                        map.setOptions(mapOptions);
                    }
                }

                // 마커 툴팁이 열려있었다면 닫는다.
                AppController.closeMapTooltip();
                break;
            }

            // 혼잡 지역 초기화
            case _congestionButtonValues.CANCEL_CONGESTION_SETTING: {
                AppController.cancelCongestionSetting(map);
                break;
            }

            // 도보 거리 계산
            case _congestionButtonValues.WALKING_DISTANCE: {
                selectedExit = appModel.selectedExit;

                if (selectedExit) {
                    AppController.calcWalkingDistance(selectedExit, appModel.selectedShelter);
                }
                break;
            }

            // 가까운 대피소 찾기
            case _congestionButtonValues.FIND_SHELTER: {
                selectedExit = appModel.selectedExit;
                AppController.setSelectedExit(e, selectedExit);
                break;
            }

            // 비상구 추천
            case _congestionButtonValues.RECOMMEND_EXIT: {
                const selectedPolygon = appModel.selectedPolygon,
                    {code, data} = await Requester.getPriority(selectedPolygon.markers);

                if (code.toLowerCase() === _responseCode.OK) {
                    const exitList = data["ranked_entrances"];

                    for (const [idx, exit] of exitList.entries()) {
                        const {id} = exit,
                            exitModel = appModel.getExitModel(parseInt(id));

                        if (exitModel) {
                            exitModel.showPriority(idx + 1);
                        }
                    }
                }
                break;
            }

            // 비상구 설정하기
            case _congestionButtonValues.SET_EXIT: {
                status = _statusType.EXIT_SETTING;
                break;
            }

            // 비상구 초기화
            case _congestionButtonValues.RESET_EXIT: {
                AppController.cancelExitSetting(map);
                break;
            }

            // 비상구 설정 완료
            case _congestionButtonValues.FINISH_EXIT: {
                const {tempPolygonModel, tempExitModels} = appModel,
                    {code} = await Requester.saveCrowdedArea(tempPolygonModel.pathList, tempExitModels);

                if (code === _responseCode.OK) {
                    const exitModels = [...appModel.exitModels, ...tempExitModels],
                        polygonModels = [...appModel.polygonModels, ...[tempPolygonModel]];

                    tempPolygonModel.addMarkers(tempExitModels);
                    appModel.setValue("exitModels", exitModels);
                    appModel.setValue("polygonModels", polygonModels);

                    isEnableMap = true;
                    AppController.cancelExitSetting(map, true);
                    appModel.setValue("status", Constants.STATUS_TYPE.NONE);
                }
                break;
            }

            // 혼잡 지역 삭제
            case _congestionButtonValues.DELETE_CONGESTION: {
                const selectedPolygon = appModel.selectedPolygon,
                    {code} = await Requester.deleteCrowdedArea(selectedPolygon.id);

                if (code === _responseCode.OK) {
                    appModel.removePolygon(selectedPolygon);
                    appModel.setValue("status", Constants.STATUS_TYPE.NONE);
                }
                break;
            }
        }

        if (status) {
            appModel.setValue("status", status);
        }

        // 지도를 다시 움직일 수 있도록 설정한다.
        if (isEnableMap) {
            map.setOptions(Define.MAP_MOVE_ENABLE_OPTIONS);
        }
    }

    if (!isVisible) {
        return null;
    }

    return (
        <SETextButton desc={desc} isDisabled={isDisabled} isVisible={isVisible} onClick={_onClick} value={value}/>
    );
};