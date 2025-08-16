import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import Constants from "../common/Constants.js";
import Resources from "../common/Resources.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import {useModel} from "../controller/UseModel.js";
import {appModel, MarkerModel, PolygonModel} from "../model/AppModel.js";
import AppController from "../controller/AppController.js";
import {HomeSideBarView} from "./HomeView.js";
import {CongestionSideBarView} from "./CongestionView.js";
import * as Requester from "../api/Requester.js";
import {SEImageButton, SETab, SEMapTooltip, SEIconButton, SEInputText, SESwitch} from "../widgets/Widgets.js";
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
    _statusType = Constants.STATUS_TYPE;

const DocumentView = () => {
    const selectedTab = useModel(appModel, "selectedTab");

    useEffect(() => {
        if (appModel.selectedShelter) {
            appModel.selectedShelter.deSelect("selectedShelter");
        }

        if (appModel.markerTooltipModel.isVisible) {
            appModel.markerTooltipModel.hide();
        }
    }, [selectedTab]);

    return (
        <div className={_viewNames.DOCUMENT}>
            <MenuBarView selectedTab={selectedTab}/>
            <div className={`${_viewNames.CONTENTS_AREA} ${selectedTab}`}>
                <TitleBarView/>
                <MapAreaView selectedTab={selectedTab}/>
            </div>
        </div>
    );
};

const MenuBarView = (props) => {
    const {selectedTab} = props,
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
        ],
        navigate = useNavigate();

    function _onChange(e, tabName) {
        if (appModel.status === _statusType.CONGESTION_SETTING) {
            return true;
        }

        appModel.setValue("selectedTab", tabName);
    }

    async function _doLogout() {
        const response = await Requester.doLogout();

        if (response.code === Constants.RESPONSE_CODE.OK) {
            localStorage.removeItem("accessToken");
            navigate("/");
        }
    }

    return (
        <div className={_viewNames.MENU_BAR}>
            <SEImageButton className={Constants.LOGO_TAB_BUTTON} image={`${Constants.IMAGE_URL}logo.svg`}/>
            <SETab className={Constants.MENU_TAB} direction="vertical" tabInfoList={tabInfoList} defaultTab={_menuNames.HOME}
                   value={selectedTab} descVisible={true} onChange={_onChange}/>
            <SEImageButton className={Constants.LOGOUT_BUTTON_CLASS} image={`${Constants.IMAGE_URL}user.svg`}
                           desc={Resources.LOGOUT} onClick={_doLogout}/>
        </div>
    );
};

const TitleBarView = () => {
    const {map} = appModel,
        showShelter = useModel(appModel, "showShelter"),
        [query, setQuery] = useState(""),
        [results, setResults] = useState([]),
        [searchModel, setSearchModel] = useState(null),
        places = useRef(null);

    function _doSearch(e) {
        const value = e.target.value;

        setQuery(value);

        if (!value || !places.current) {
            setResults([]);
            return;
        }

        places.current.keywordSearch(value, (data, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                setResults(data);
            } else {
                setResults([]);
            }
        })
    }

    function _onClickListItem(item) {
        let newSearchModel;

        if (searchModel) {
            searchModel.hide();
        }

        newSearchModel = new MarkerModel({
            position: Util.getLocationObj({latitude: item.y, longitude: item.x}, _naverMap),
            naverMap: _naverMap,
            map: appModel.map,
            hasMarker: false
        });

        newSearchModel.show(true);
        setSearchModel(newSearchModel);

        AppController.setCrowdedInfo(map);
        appModel.setValue("curAddress", item[Define.DESC_PROP_NAME]);
    }

    function _onToggleSwitch(e) {
        appModel.setValue("showShelter", !showShelter);
    }

    useEffect(() => {
        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
                places.current = new window.kakao.maps.services.Places();
            });
        }
    }, []);

    return (
        <div className={_viewNames.TITLE_BAR}>
            <SEInputText inputClassName={Constants.SEARCH_INPUT_CLASS} value={query} placeholder={Resources.SEARCH_ADDRESS} onChange={_doSearch}
                         listClassName={Constants.SEARCH_LIST_BOX_CLASS} hasList={true} listData={results} onFocus={_doSearch}
                         onClickListItem={_onClickListItem} onListClose={() => setResults([])}
                         keyProp={Define.KEY_PROP_NAME} titleProp={Define.TITLE_PROP_NAME} descProp={Define.DESC_PROP_NAME}/>
            <div className={Constants.SHELTER_SWITCH_CLASS}>
                <SESwitch isOn={showShelter} onChange={_onToggleSwitch} desc={Resources.SHELTER_SWITCH}/>
            </div>
        </div>
    );
};

const MapAreaView = (props) => {
    const {selectedTab} = props,
        {map} = appModel,
        status = useModel(appModel, "status"),
        showShelter = useModel(appModel, "showShelter"),

        // 메인
        exitModels = useModel(appModel, "exitModels"),
        polygonModels = useModel(appModel, "polygonModels"),
        congestionModels = useModel(appModel, "congestionModels"),
        shelterModels = useModel(appModel, "shelterModels"),

        // 지도 위치 이동 시
        centerModel = useModel(appModel, "centerModel"),
        refreshBtnEnabled = useModel(appModel, "refreshBtnEnabled"),

        // 혼잡 지역 설정 시
        tempPolygonModel = useModel(appModel, "tempPolygonModel"),
        tempEdgeModels = useModel(appModel, "tempEdgeModels"),
        tempExitModels = useModel(appModel, "tempExitModels"),

        // 혼잡 지역 선택 시
        selectedPolygon = useModel(appModel, "selectedPolygon");

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

            AppController.setCrowdedInfo(map);
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
            let polygonModel = tempPolygonModel;

            markerModel = new MarkerModel({
                naverMap: _naverMap,
                hasMarker: false,
                position: coord,
                map
            });

            newModels = [...appModel["tempEdgeModels"], markerModel];
            appModel.setValue("tempEdgeModels", newModels);
            markerModel.show();

            if (!polygonModel) {
                polygonModel = new PolygonModel({
                    map,
                    naverMap: _naverMap,
                    onClick: (e, model) => {
                        if (!appModel.isSettingStatus()) {
                            appModel.setValue("selectedPolygon", model);
                            appModel.setValue("status", _statusType.CONGESTION_SELECTED);
                        }
                    }
                });
            }

            polygonModel.addPath(markerModel.position);
            polygonModel.show();
            appModel.setValue("tempPolygonModel", polygonModel);
        } else if (status === _statusType.EXIT_SETTING) {
            if (Util.isContainsCoord(coord, tempPolygonModel.pathList)) {
                markerModel = new MarkerModel({
                    icon: `${Constants.IMAGE_URL}exit_marker.svg`,
                    position: coord,
                    naverMap: _naverMap,
                    removable: true,
                    onClick: (e) => {AppController.setSelectedExit(e, markerModel)},
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
        if (selectedTab === _menuNames.CONGESTION && appModel.isSettingStatus()) {
            const clickListener = _naverMap.maps.Event.addListener(appModel.map, "click", _onClickMap);

            appModel.setValue("refreshBtnEnabled", false);

            return () => {
                _naverMap.maps.Event.removeListener(clickListener);
            };
        }
    }, [status, tempPolygonModel, tempEdgeModels]);

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

    useEffect(() => {
        if (selectedPolygon) {
            const target = selectedPolygon.element;

            if (target) {
                Util.addClass(target, Constants.SELECTED_CLASS);
            }
        }
    }, [selectedPolygon]);

    useEffect(() => {
        if (congestionModels?.length > 0) {
            for (const model of congestionModels) {
                model.show();
            }
        }
    }, [congestionModels]);

    useEffect(() => {
        if (shelterModels?.length > 0) {
            for (const model of shelterModels) {
                if (showShelter) {
                    model.show();
                } else {
                    model.hide();
                }
            }
        }
    }, [shelterModels, showShelter]);

    useEffect(() => {
        if (polygonModels?.length > 0) {
            for (const model of polygonModels) {
                model.show();
            }
        }
    }, [polygonModels]);

    useEffect(() => {
        if (exitModels?.length > 0) {
            for (const model of exitModels) {
                if (model.isRemovable) {
                    model.setValue("isRemovable", false);
                }

                model.show();
            }
        }
    }, [exitModels]);

    useEffect(() => {
        if (map) {
            const centerPos = map.getCenter();

            // 혼잡 정보를 불러온다.
            AppController.setCrowdedInfo(map);

            // 중심 좌표 모델을 설정한다.
            appModel.setValue("centerModel", new MarkerModel({
                position: centerPos,
                map,
                naverMap: _naverMap,
                hasMarker: false
            }));
        }
    }, [map]);

    return (
        <div className={_viewNames.MAP_AREA}>
            <Map showTooltip={true} tabValue={selectedTab}/>
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
        {isTextOnly} = markerTooltipModel,
        isVisible = useModel(markerTooltipModel, "isVisible"),
        style = useModel(markerTooltipModel, "style"),
        contentRef = useRef(null),
        [styleObj, setStyleObj] = useState(style || {});

    function _onClose() {
        AppController.closeMapTooltip(centerModel);
    }

    useEffect(() => {
        if (isVisible && contentRef.current && !Util.isEmptyObject(style)) {
            const width = contentRef.current.offsetWidth,
                height = contentRef.current.offsetHeight;
            let newStyle = style;

            if (isTextOnly) {
                newStyle = {
                    ...newStyle,
                    left: `${parseFloat(style["left"]) - width / 2}px`,
                    top: `${parseFloat(style["top"]) - height}px`
                };
            }

            setStyleObj(newStyle);
        }
    }, [isVisible, style]);

    if (!markerTooltipModel || !markerTooltipModel.isVisible) {
        return null;
    }

    return (
        <SEMapTooltip ref={contentRef} image={`${Constants.IMAGE_URL}marker_selected.svg`} isOpen={isVisible} style={styleObj}
                      isTextOnly={isTextOnly} title={markerTooltipModel.title} desc={markerTooltipModel.desc} onClose={_onClose}/>
    );
};

export default DocumentView;