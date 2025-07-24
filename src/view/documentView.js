import {useEffect, useRef, useState} from "react";
import Constants from "../common/constants.js";
import Resources from "../common/resources.js";
import Define from "../common/define.js";
import Util from "../common/utils.js";
import {useModel} from "../controller/UseModel.js";
import {appModel, MarkerModel} from "../model/AppModel.js";
import {SETextButton, SEImageButton, SETab, SEText, SEImage, SEMapTooltip} from "../widgets/widgets.js";

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
    };

const DocumentView = () => {
    return (
        <div className={_viewNames.DOCUMENT}>
            <MenuBarView/>
            <TitleBarView/>
        </div>
    );
};

const MenuBarView = () => {
    const tabInfoList = [
        {
            name: _menuNames.HOME,
            image: `${Constants.IMAGE_URL}home.svg`,
            panel: <MapAreaView name={_menuNames.HOME}/>
        },
        {
            name: _menuNames.CONGESTION,
            image: `${Constants.IMAGE_URL}congestion.svg`,
            panel: <MapAreaView name={_menuNames.CONGESTION}/>
        }
    ];

    function _onClick(e) {

    }

    return (
        <div className={_viewNames.MENU_BAR}>
            <SEImageButton className={Constants.LOGO_TAB_BUTTON} image={`${Constants.IMAGE_URL}logo.svg`} onClick={_onClick}/>
            <SETab className={Constants.MENU_TAB} direction="vertical" tabInfoList={tabInfoList} defaultTab={_menuNames.HOME}/>
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
    const {name} = props;

    return (
        <div className={_viewNames.MAP_AREA}>
            {name === _menuNames.HOME ? <HomeMapView/> : <CongestionMapView/>}
        </div>
    );
};

const SideBarView = (props) => {
    const {name} = props;

    return (
        <div className={`${name} ${_viewNames.SIDE_BAR}`}>
            {name === _menuNames.HOME ?
                <HomeSideBarView/> :
                <CongestionSideBarView/>}
        </div>
    );
};

const HomeSideBarView = () => {
    const shelterList = [       /** TODO: 테스트용 */
            {
                address: "인수동 자치회관",
                detail: "서울특별시 강북구 인수봉로 255",
                coordinates: {
                    latitude: 37.6414869298367,
                    longitude: 127.010596846898
                }
            },
            {
                address: "성균관대학교 자연과학캠퍼스",
                detail: "경기 수원시 장안구 서부로 2066",
                coordinates: {
                    latitude: 37.2959770000514,
                    longitude: 126.974164012539
                }
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

            for (const shelter of shelterList) {
                const {address, detail, coordinates} = shelter,
                    markerModel = new MarkerModel({
                        position: Util.getLocationObj(coordinates, _naverMap),
                        title: address,
                        desc: detail,
                        onClick: _onClickMarker,
                        map,
                        naverMap: _naverMap
                    });

                if (markerModel) {
                    markerModels.push(markerModel);

                    btnList.push(
                        <SETextButton title={address} desc={detail} onClick={e => _onClickButton(e, markerModel)}/>
                    );
                }
            }

            appModel.setValue("markerModels", markerModels);
            setShelterBtnList(btnList);
        }
    }, [map]);

    return (
        <>
            <SEImage image={`${Constants.IMAGE_URL}shelter.svg`}/>
            <SEText className={Constants.TITLE_CLASS} desc={Resources.NEARBY_SHELTER} color={Constants.COLORS.RED}/>
            <SEText className={Constants.SUBTITLE_CLASS} desc="강북구 삼각산로"/> {/** TODO: 테스트용 */}
            <div className={Constants.SHELTER_LIST_CLASS}>
                {shelterBtnList}
            </div>
        </>
    );
};

const CongestionSideBarView = () => {
    function _onClick(e) {}

    return (
        <>
            <SETextButton desc={Resources.SET_CONGESTION_AREA} isDisabled={false}/>
            <SETextButton desc={Resources.CALC_WALKING_DISTANCE} isDisabled={false}/>
            <SETextButton desc={Resources.FIND_NEARBY_SHELTER} isDisabled={false}/>
            <SETextButton desc={Resources.RECOMMEND_EXIT} isDisabled={false}/>
            <SETextButton desc={Resources.CANCEL_CONGESTION_AREA} isDisabled={false}/>
            <SETextButton desc={Resources.SET_EXIT} isDisabled={false}/>
            <SETextButton desc={Resources.RESET_EXIT} isDisabled={false}/>
            <SETextButton desc={Resources.FINISH_EXIT} isDisabled={false}/>
        </>
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

const HomeMapView = () => {
    const centerModel = useModel(appModel, "centerModel"),
        name = Constants.MENU_NAMES.HOME;

    useEffect(() => {
        if (centerModel) {
            centerModel.show(true);
        }
    }, [centerModel]);

    return (
        <div className={`${_viewNames.CONTENTS_AREA} ${name}`}>
            <Map showTooltip={true}/>
            <MarkerTooltipView/>
            <SideBarView name={name}/>
        </div>
    );
};

const MarkerTooltipView = () => {
    const markerTooltipModel = appModel.markerTooltipModel,
        centerModel = appModel.centerModel,
        isVisible = useModel(markerTooltipModel, "isVisible");

    if (!markerTooltipModel || !markerTooltipModel.isVisible) {
        return null;
    }

    function _onCloseTooltip() {
        centerModel.deSelect();
        markerTooltipModel.hide();
    }

    return (
        <SEMapTooltip image={`${Constants.IMAGE_URL}markerSelected.svg`} isOpen={isVisible}
                      title={markerTooltipModel.title} desc={markerTooltipModel.desc} onClose={_onCloseTooltip}/>
    );
};

const CongestionMapView = () => {
    const name = Constants.MENU_NAMES.CONGESTION;

    return (
        <div className={`${_viewNames.CONTENTS_AREA} ${name}`}>
            <Map/>
            <SideBarView name={name}/>
        </div>
    );
};

export default DocumentView;