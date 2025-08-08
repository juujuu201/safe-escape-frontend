import {useEffect, useRef, useState} from "react";
import Constants from "../common/Constants.js";
import Resources from "../common/Resources.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import {useModel} from "../controller/UseModel.js";
import {appModel, MarkerModel} from "../model/AppModel.js";
import AppController from "../controller/AppController.js";
import {HomeSideBarView} from "./HomeView.js";
import {CongestionSideBarView} from "./CongestionView.js";
import {SEImageButton, SETab, SEMapTooltip, SEIconButton} from "../widgets/Widgets.js";
import {Refresh} from "@mui/icons-material";

const _naverMap = window.naver,
    _viewNames = Constants.VIEW_NAMES,
    _menuNames = Constants.MENU_NAMES,
    _mapOptionKeys = Constants.MAP_OPTION_KEYS,
    _defaultMapOptions = {
        [`${_mapOptionKeys.DEFAULT_LOCATION}`]: Util.getLocationObj(Define.DEFAULT_LOCATION, _naverMap),
        [`${_mapOptionKeys.DISABLE_DOUBLE_CLICK_ZOOM}`]: Define.DISABLE_DOUBLE_CLICK_ZOOM,
        [`${_mapOptionKeys.DISABLE_DOUBLE_TAP_ZOOM}`]: Define.DISABLE_DOUBLE_TAP_ZOOM,
        [`${_mapOptionKeys.DISABLE_TWO_FINGER_TAP_ZOOM}`]: Define.DISABLE_TWO_FINGER_TAP_ZOOM,
        [`${_mapOptionKeys.LOGO_CONTROL}`]: Define.LOGO_CONTROL,
        [`${_mapOptionKeys.MAP_DATA_CONTROL}`]: Define.MAP_DATA_CONTROL,
        [`${_mapOptionKeys.ZOOM}`]: Define.ZOOM,
        [`${_mapOptionKeys.SCALE_CONTROL}`]: Define.SCALE_CONTROL
    },
    _congestionButtonValues = Constants.CONGESTION_BUTTON_VALUES,
    _statusType = Constants.STATUS_TYPE,
    _themeColor = Constants.COLORS.THEME;

const DocumentView = () => {
    const [tabValue, setTabValue] = useState(_menuNames.HOME);

    return (
        <div className={_viewNames.DOCUMENT}>
            <MenuBarView setTabValue={setTabValue}/>
            <div className={`${_viewNames.CONTENTS_AREA} ${tabValue}`}>
                <TitleBarView/>
                <MapAreaView tabValue={tabValue}/>
            </div>
        </div>
    );
};

const MenuBarView = (props) => {
    const {setTabValue} = props,
        tabInfoList = [
        {
            name: _menuNames.HOME,
            image: `${Constants.IMAGE_URL}home.svg`,
            panel: <HomeSideBarView/>
        },
        {
            name: _menuNames.CONGESTION,
            image: `${Constants.IMAGE_URL}congestion.svg`,
            panel: <CongestionSideBarView/>
        }
    ];

    function _onClick(e) {

    }

    function _onChange(e, tabName) {
        if (appModel.status === _statusType.CONGESTION_SETTING) {
            return true;
        }

        setTabValue(tabName);
    }

    return (
        <div className={_viewNames.MENU_BAR}>
            <SEImageButton className={Constants.LOGO_TAB_BUTTON} image={`${Constants.IMAGE_URL}logo.svg`} onClick={_onClick}/>
            <SETab className={Constants.MENU_TAB} direction="vertical" tabInfoList={tabInfoList} defaultTab={_menuNames.HOME} descVisible={true} onChange={_onChange}/>
        </div>
    );
};

const TitleBarView = () => {
    return (
        <div className={_viewNames.TITLE_BAR}>

        </div>
    );
};

const MapAreaView = (props) => {
    const {tabValue} = props,
        centerModel = useModel(appModel, "centerModel"),
        refreshBtnEnabled = useModel(appModel, "refreshBtnEnabled"),
        status = useModel(appModel, "status"),
        polygon = useModel(appModel, "tempPolygonArea"),
        tempEdgeModels = useModel(appModel, "tempEdgeModels"),
        tempExitModels = useModel(appModel, "tempExitModels"),
        map = appModel.map;

    function _onClickRefresh() {
        if (map) {
            const centerPos = map.getCenter();

            appModel.setValue("refreshBtnEnabled", false);
            appModel.setValue("centerModel", new MarkerModel({
                position: centerPos,
                map,
                naverMap: _naverMap,
                hasMarker: false
            }));

            /* TODO: 현재 위치에서 대피소 재검색 */
        }
    }

    function _onClickMap(e) {
        const {coord} = e,
            tempEdgeLen = tempEdgeModels.length;
        let markerModel, newModels, pathList;

        if (tempEdgeLen >= Constants.MAX_CONGESTION_MARKER) {
            return;
        }

        if (status === _statusType.CONGESTION_SETTING) {
            markerModel = new MarkerModel({
                naverMap: _naverMap,
                hasMarker: false,
                position: coord,
                map
            });

            newModels = [...appModel["tempEdgeModels"], markerModel];
            appModel.setValue("tempEdgeModels", newModels);
            markerModel.show();

            if (polygon) {
                polygon.setMap(null);
            }

            // 2개 이상 선택된 경우
            if (newModels?.length > 1) {
                pathList = newModels.map(model => model.position);

                // polygon 표시
                if (pathList) {
                    pathList = Util.sortPointsClockwise(pathList);

                    appModel.setValue("tempPolygonArea",
                        new _naverMap.maps.Polygon({
                            paths: Util.sortPointsClockwise(pathList),
                            strokeColor: _themeColor,
                            fillColor: _themeColor,
                            fillOpacity: 0.2,
                            map: appModel.map
                        }));
                }
            }
        } else if (status === _statusType.EXIT_SETTING) {
            pathList = tempEdgeModels.map(model => model.position);

            if (Util.isContainsCoord(coord, pathList)) {
                markerModel = new MarkerModel({
                    icon: `${Constants.IMAGE_URL}exit_marker.svg`,
                    position: coord,
                    naverMap: _naverMap,
                    removable: true,
                    map
                });

                newModels = [...appModel["tempExitModels"], markerModel];
                appModel.setValue("tempExitModels", newModels);
                markerModel.show();
            }
        }
    }

    useEffect(() => {
        if (centerModel) {
            centerModel.show(true);
        }
    }, [centerModel]);

    useEffect(() => {
        if (tabValue === _menuNames.CONGESTION
            && (status === _statusType.CONGESTION_SETTING || status === _statusType.EXIT_SETTING)) {
            const clickListener = _naverMap.maps.Event.addListener(appModel.map, "click", _onClickMap);

            return () => {
                _naverMap.maps.Event.removeListener(clickListener);
            };
        }
    }, [status, polygon, tempEdgeModels]);

    useEffect(() => {
        if (tempEdgeModels) {
            const setExitBtn = appModel.menuButtonModels.find(model => model.value === _congestionButtonValues.SET_EXIT);

            // '비상구 설정하기' 버튼 활성화/비활성화
            if (setExitBtn) {
                setExitBtn.setValue("isDisabled", tempEdgeModels.length < 2);
            }
        }
    }, [tempEdgeModels]);

    useEffect(() => {
        if (tempExitModels?.length > 0) {
            const setFinishBtn = appModel.menuButtonModels.find(model => model.value === _congestionButtonValues.FINISH_EXIT);

            // '비상구 설정 완료' 버튼 활성화/비활성화
            if (setFinishBtn && setFinishBtn.isDisabled) {
                setFinishBtn.setValue("isDisabled", false);
            }
        }
    }, [tempExitModels]);

    return (
        <div className={_viewNames.MAP_AREA}>
            <Map showTooltip={true} tabValue={tabValue}/>
            <MarkerTooltipView/>
            {refreshBtnEnabled && <SEIconButton className={`${Constants.REFRESH_BTN_CLASS}`} icon={<Refresh/>}
                                                desc={Resources.REFRESH} onClick={_onClickRefresh}/>}
        </div>
    );
};

const Map = (props) => {
    const {options, tabValue} = props,
        status = useModel(appModel, "status"),
        mapRef = useRef(null),
        classList = [tabValue];

    useEffect(() => {
        const mapOptions = {..._defaultMapOptions, ...options},
            mapObj = new _naverMap.maps.Map(
                Constants.MAP_AREA_ID,
                mapOptions
            );

        appModel.setValue("map", mapObj);
        mapRef.current = mapObj;
    }, []);

    if (status === _statusType.CONGESTION_SETTING || status === _statusType.EXIT_SETTING) {
        classList.push(Constants.SELECTING_CLASS);
    }

    return <div id={Constants.MAP_AREA_ID} className={classList.join(" ")}/>;
};

const MarkerTooltipView = () => {
    const {markerTooltipModel, centerModel} = appModel,
        isVisible = useModel(markerTooltipModel, "isVisible"),
        style = useModel(markerTooltipModel, "style") || {};

    function _onClose() {
        AppController.closeMapTooltip(centerModel);
    }

    if (!markerTooltipModel || !markerTooltipModel.isVisible) {
        return null;
    }

    return (
        <SEMapTooltip image={`${Constants.IMAGE_URL}marker_selected.svg`} isOpen={isVisible} style={style}
                      title={markerTooltipModel.title} desc={markerTooltipModel.desc} onClose={_onClose}/>
    );
};

export default DocumentView;