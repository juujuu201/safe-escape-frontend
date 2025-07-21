import Constants from "../common/constants.js";
import Resources from "../common/resources.js";
import {SETextButton, SEImageButton, SETab, SEText, SEImage} from "../widgets/widgets.js";

const _viewNames = Constants.VIEW_NAMES,
    _menuNames = Constants.MENU_NAMES;

const DocumentView = () => {
    return (
        <div className={_viewNames.DOCUMENT}>
            <MenuBarView/>
            {/*<ContentsAreaView/>*/}
        </div>
    );
};

const MenuBarView = () => {
    const tabInfoList = [
        {
            name: _menuNames.HOME,
            image: "/images/home.svg",
            panel: <MapAreaView name={_menuNames.HOME}/>
        },
        {
            name: _menuNames.CONGESTION,
            image: "/images/congestion.svg",
            panel: <MapAreaView name={_menuNames.CONGESTION}/>
        }
    ];

    function _onClick(e) {

    }

    return (
        <div className={_viewNames.MENU_BAR}>
            <SEImageButton className={Constants.LOGO_TAB_BUTTON} image="/images/logo.svg" onClick={_onClick}/>
            <SETab className={Constants.MENU_TAB} direction="vertical" tabInfoList={tabInfoList}/>
        </div>
    );
};

const ContentsAreaView = () => {
    return (
        <div className={_viewNames.CONTENTS_AREA}>
            <TitleBarView/>
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
            {name === _menuNames.HOME ? <HomeSideBarView/>: <CongestionSideBarView/>}
        </div>
    );
};

const HomeSideBarView = () => {
    const shelterList = [       /** TODO: 테스트용 */
            {
                address: "인수동 자치회관",
                detail: "서울특별시 강북구 인수봉로 255"
            },
            {
                address: "인수동 자치회관",
                detail: "서울특별시 강북구 인수봉로 255"
            }
        ],
        shelterBtnList = [];

    function _onClick(e) {

    }

    if (shelterList?.length > 0) {
        for (const shelter of shelterList) {
            const {address, detail} = shelter;

            shelterBtnList.push(
                <SETextButton title={address} desc={detail} onClick={_onClick}/>
            );
        }
    }
    return (
        <>
            <SEImage image="/images/shelter.svg"/>
            <SEText className={Constants.TITLE_CLASS} desc={Resources.NEARBY_SHELTER} color={Constants.COLORS.RED}/>
            <SEText className={Constants.SUBTITLE_CLASS} desc="강북구 삼각산로"/> {/** TODO: 테스트용 */}
            {shelterBtnList}
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

const HomeMapView = () => {
    const name = Constants.MENU_NAMES.HOME;

    return (
        <div className={`${_viewNames.CONTENTS_AREA} ${name}`}>
            home
            <SideBarView name={name}/>
        </div>
    );
};

const CongestionMapView = () => {
    const name = Constants.MENU_NAMES.CONGESTION;

    return (
        <div className={`${_viewNames.CONTENTS_AREA} ${name}`}>
            congestion
            <SideBarView name={name}/>
        </div>
    );
};

export default DocumentView;