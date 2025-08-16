import {useEffect, useState} from "react";
import {useModel} from "../controller/UseModel.js";
import Constants from "../common/Constants.js";
import Resources from "../common/Resources.js";
import {appModel} from "../model/AppModel.js";
import {SEImage, SEText, SETextButton} from "../widgets/Widgets.js";

const _naverMap = window.naver,
    _viewNames = Constants.VIEW_NAMES,
    _menuNames = Constants.MENU_NAMES,
    _statusType = Constants.STATUS_TYPE;

export const HomeSideBarView = () => {
    const shelterModels = useModel(appModel, "shelterModels"),
        [shelterBtnList, setShelterBtnList] = useState([]);

    function _onClickButton(e, markerModel) {
        appModel.setValue("centerModel", markerModel);
    }

    useEffect(() => {
        if (shelterModels?.length > 0) {
            const btnList = [];

            for (const model of shelterModels) {
                // 사이드바 내 대피소 목록 표시
                const {modelId, title, desc} = model;

                btnList.push(
                    <SETextButton key={modelId} title={title} desc={desc} onClick={e => _onClickButton(e, model)}/>
                );
            }

            setShelterBtnList(btnList);
        }
    }, [shelterModels]);

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