import {useEffect, useRef, useState} from "react";
import Constants from "../common/constants.js";
import Resources from "../common/resources.js";
import Define from "../common/define.js";
import Util from "../common/utils.js";
import {useModel} from "../controller/UseModel.js";
import {appModel, MarkerModel, CongestionModel, MenuButtonModel} from "../model/AppModel.js";
import AppController from "../controller/AppController.js";
import {SETextButton, SEImageButton, SETab, SEText, SEImage, SEMapTooltip, SEIconButton, SEMessageBar} from "../widgets/widgets.js";
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
    _defaultButtonGroup = [
        _congestionButtonValues.SET_CONGESTION,
        _congestionButtonValues.WALKING_DISTANCE,
        _congestionButtonValues.FIND_SHELTER,
        _congestionButtonValues.RECOMMEND_EXIT
    ],
    _statusType = Constants.STATUS_TYPE,
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
        [`${_statusType.CONGESTION_SELECTED}`]: _defaultButtonGroup,
        [`${_statusType.EXIT_SELECTED}`]: _defaultButtonGroup
};

const DocumentView = () => {
    return (
        <div className={_viewNames.DOCUMENT}>
            <MenuBarView/>
            <div className={_viewNames.CONTENTS_AREA}>
                <TitleBarView/>
                <MapAreaView name={_menuNames.HOME}/>
            </div>
        </div>
    );
};

const MenuBarView = () => {
    const tabInfoList = [
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

    return (
        <div className={_viewNames.MENU_BAR}>
            <SEImageButton className={Constants.LOGO_TAB_BUTTON} image={`${Constants.IMAGE_URL}logo.svg`} onClick={_onClick}/>
            <SETab className={Constants.MENU_TAB} direction="vertical" tabInfoList={tabInfoList} defaultTab={_menuNames.HOME} descVisible={true}/>
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
    const centerModel = useModel(appModel, "centerModel"),
        refreshBtnEnabled = useModel(appModel, "refreshBtnEnabled");

    function _onClickRefresh() {
        const map = appModel.map;

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

    useEffect(() => {
        if (centerModel) {
            centerModel.show(true);
        }
    }, [centerModel]);

    return (
        <div className={_viewNames.MAP_AREA}>
            <Map showTooltip={true}/>
            <MarkerTooltipView/>
            {refreshBtnEnabled && <SEIconButton className={`${Constants.REFRESH_BTN_CLASS}`} icon={<Refresh/>}
                                                desc={Resources.REFRESH} onClick={_onClickRefresh}/>}
        </div>
    );
};

const HomeSideBarView = () => {
    const shelterList = [       /** TODO: 테스트용 */
            {
                id: "1",
                name: "인수동 자치회관",
                address: "서울특별시 강북구 인수봉로 255",
                latitude: 37.635451,
                longitude: 127.019194
            },
            {
                id: "2",
                name: "성균관대학교 자연과학캠퍼스",
                address: "경기 수원시 장안구 서부로 2066",
                latitude: 37.293929,
                longitude: 126.974348
            }
        ],
        congestionList = [
            {
                latitude: 37.646713,
                longitude: 127.024274,
                level: Constants.CROWDED_LEVEL.FREE
            },
            {
                latitude: 37.634296,
                longitude: 127.017533,
                level: Constants.CROWDED_LEVEL.CROWDED
            }
        ],
        map = useModel(appModel, "map"),
        [shelterBtnList, setShelterBtnList] = useState([]);

    function _onClickButton(e, markerModel) {
        appModel.setValue("centerModel", markerModel);
    }

    function _onClickMarker(e, markerModel) {
        appModel.markerTooltipModel.show(markerModel);
    }

    useEffect(() => {
        if (map) {
            const markerModels = [],
                btnList = [];

            // 대피소 마커 모델 생성
            for (const shelter of shelterList) {
                const {id, name, address, latitude, longitude} = shelter,
                    markerModel = new MarkerModel({
                        position: Util.getLocationObj({latitude, longitude}, _naverMap),
                        title: name,
                        desc: address,
                        onClick: _onClickMarker,
                        map,
                        naverMap: _naverMap
                    });

                if (markerModel) {
                    markerModels.push(markerModel);

                    // 사이드바 내 대피소 목록 표시
                    btnList.push(
                        <SETextButton key={id} title={name} desc={address} onClick={e => _onClickButton(e, markerModel)}/>
                    );
                }
            }

            appModel.setValue("markerModels", markerModels);
            setShelterBtnList(btnList);

            // 혼잡도 모델 생성
            for (const congestion of congestionList) {
                const {latitude, longitude, level} = congestion,
                    congestionModel = new CongestionModel({
                        position: Util.getLocationObj({latitude, longitude}, _naverMap),
                        level,
                        map,
                        naverMap: _naverMap
                    });

                if (congestionModel) {
                    congestionModel.show();
                }
            }
        }
    }, [map]);

    return (
        <div className={`${_menuNames.HOME} ${_viewNames.SIDE_BAR}`}>
            <SEImage image={`${Constants.IMAGE_URL}shelter.svg`}/>
            <SEText className={Constants.TITLE_CLASS} desc={Resources.NEARBY_SHELTER} color={Constants.COLORS.RED}/>
            <SEText className={Constants.SUBTITLE_CLASS} desc="강북구 삼각산로"/> {/** TODO: 테스트용 */}
            <div className={Constants.SHELTER_LIST_CLASS}>
                {shelterBtnList}
            </div>
        </div>
    );
};

const CongestionSideBarView = () => {
    const status = useModel(appModel, "status"),
        [buttonList, setButtonList] = useState([]);

    useEffect(() => {
        const buttonModels = [];

        for (const [key, value] of Object.entries(_congestionButtonValues)) {
            const model = new MenuButtonModel({
                desc: Resources[key],
                value
            });

            buttonModels.push(model);
            buttonList.push(
                <CongestionMenuButton model={model} isDisable/>
            );
        }

        appModel.setValue("menuButtonModels", buttonModels);
        setButtonList(buttonList);
    }, []);

    useEffect(() => {
        if (status) {
            for (const model of appModel.menuButtonModels) {
                const menuButtonGroup = _menuButtonGroup[status];

                if (menuButtonGroup) {
                    const value = model.value,
                        isVisible = (menuButtonGroup.indexOf(value) !== -1);

                    if (model.isVisible !== isVisible) {
                        model.setValue("isVisible", isVisible);
                    }

                    if (isVisible) {
                        const targetModels = [];

                        switch (status) {
                            case _statusType.NONE:
                            default:
                                if (value === _congestionButtonValues.SET_CONGESTION) {
                                    targetModels.push(model);
                                }
                                break;
                        }

                        if (targetModels.length > 0) {
                            for (const targetModel of targetModels) {
                                if (model.isDisabled) {
                                    targetModel.setValue("isDisabled", false);
                                }
                            }
                        }
                    }
                }
            }
        }
    }, [status]);

    return (
        <div className={Constants.CONGESTION_MENU_AREA_CLASS}>
            <SEMessageBar desc={"test test test test test"}/>
            <div className={`${_menuNames.CONGESTION} ${_viewNames.SIDE_BAR}`}>
                {buttonList}
            </div>
        </div>
    );
};

const CongestionMenuButton = (props) => {
    const {model} = props,
        {value, desc} = model,
        isVisible = useModel(model, "isVisible") ?? false,
        isDisabled = useModel(model, "isDisabled") ?? true;

    function _onClick(e) {
        switch (value) {
            // 혼잡 지역 설정하기
            case _congestionButtonValues.SET_CONGESTION:
                break;

            // 도보 거리 계산
            case _congestionButtonValues.WALKING_DISTANCE:
                break;

            // 가까운 대피소 찾기
            case _congestionButtonValues.FIND_SHELTER:
                break;

            // 비상구 추천
            case _congestionButtonValues.RECOMMEND_EXIT:
                break;

            // 혼잡 지역 취소
            case _congestionButtonValues.CANCEL_CONGESTION_SETTING:
                break;

            // 비상구 설정하기
            case _congestionButtonValues.SET_EXIT:
                break;

            // 비상구 초기화
            case _congestionButtonValues.RESET_EXIT:
                break;

            // 비상구 설정 완료
            case _congestionButtonValues.FINISH_EXIT:
                break;
        }
    }

    return (
        <SETextButton key={value} desc={desc} isDisabled={isDisabled} isVisible={isVisible} onClick={_onClick}/>
    );
};

const Map = (props) => {
    const {options} = props,
        mapRef = useRef(null);

    useEffect(() => {
        const mapOptions = {..._defaultMapOptions, ...options},
            mapObj = new _naverMap.maps.Map(
                Constants.MAP_AREA_ID,
                mapOptions
            );

        appModel.setValue("map", mapObj);
        mapRef.current = mapObj;
    }, []);

    return <div id={Constants.MAP_AREA_ID}/>;
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
        <SEMapTooltip image={`${Constants.IMAGE_URL}markerSelected.svg`} isOpen={isVisible} style={style}
                      title={markerTooltipModel.title} desc={markerTooltipModel.desc} onClose={_onClose}/>
    );
};

export default DocumentView;