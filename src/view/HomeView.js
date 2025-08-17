import {useEffect, useState, useRef} from "react";
import {useModel} from "../controller/UseModel.js";
import Constants from "../common/Constants.js";
import Resources from "../common/Resources.js";
import {appModel} from "../model/AppModel.js";
import {SEImage, SEText, SETextButton} from "../widgets/Widgets.js";

const _viewNames = Constants.VIEW_NAMES,
    _menuNames = Constants.MENU_NAMES;

export const HomeSideBarView = () => {
    const shelterModels = useModel(appModel, "shelterModels"),
        curAddress = useModel(appModel, "curAddress"),
        [shelterBtnList, setShelterBtnList] = useState([]),
        ref = useRef(null);

    function _onClickButton(e, markerModel) {
        appModel.setValue("centerModel", markerModel);
        appModel.setValue("selectedShelter", markerModel);
        appModel.markerTooltipModel.show(markerModel);
    }

    useEffect(() => {
        if (shelterModels?.length > 0) {
            const btnList = [];

            for (const model of shelterModels) {
                // 사이드바 내 대피소 목록 표시
                const {title, desc} = model;

                btnList.push(
                    <SETextButton key={model.modelId()} title={title} desc={desc} onClick={e => _onClickButton(e, model)}/>
                );
            }

            setShelterBtnList(btnList);
        }
    }, [shelterModels]);

    useEffect(() => {
        if (ref.current) {
            appModel.setValue("sideBarRef", ref);
        }
    }, [ref]);

    return (
        <div className={`${_menuNames.HOME} ${_viewNames.SIDE_BAR}`} ref={ref}>
            <SEImage image={`${Constants.IMAGE_URL}shelter.svg`}/>
            <SEText className={Constants.TITLE_CLASS} desc={Resources.NEARBY_SHELTER} color={Constants.COLORS.RED}/>
            {curAddress && <SEText className={Constants.SUBTITLE_CLASS} desc={curAddress}/>}
            <div className={Constants.SHELTER_LIST_CLASS}>
                {shelterBtnList}
            </div>
        </div>
    );
};