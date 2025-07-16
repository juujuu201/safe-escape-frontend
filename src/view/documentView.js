import {useState} from "react";
import Constants from "../common/constants.js";
import {HIconButton} from "../widgets/widgets";

const _viewNames = Constants.VIEW_NAMES;

const DocumentView = () => {
    return (
        <div className={_viewNames.DOCUMENT}>
            <MenuBarView/>
            <ContentsAreaView/>
        </div>
    );
};

const MenuBarView = () => {
    return (
        <div className={_viewNames.MENU_BAR}>

        </div>
    );
};

const ContentsAreaView = () => {
    return (
        <div className={_viewNames.CONTENTS_AREA}>
            <TitleBarView/>
            <MapAreaView/>
            <SideBarView/>
        </div>
    );
};

const TitleBarView = () => {
    return (
        <div className={_viewNames.TITLE_BAR}>

        </div>
    );
};

const MapAreaView = () => {
    return (
        <div className={_viewNames.MAP_AREA}>

        </div>
    );
};

const SideBarView = () => {
    return (
        <div className={_viewNames.SIDE_BAR}>

        </div>
    );
};

export default DocumentView;