import {useEffect, useState} from "react";
import {useModel} from "../controller/UseModel.js";
import Constants from "../common/Constants.js";
import Resources from "../common/Resources.js";
import Util from "../common/Utils.js";
import {appModel, CongestionModel, MarkerModel} from "../model/AppModel.js";
import {SEImage, SEText, SETextButton} from "../widgets/Widgets.js";

const _naverMap = window.naver,
    _viewNames = Constants.VIEW_NAMES,
    _menuNames = Constants.MENU_NAMES;

export const HomeSideBarView = () => {
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

    function _onClickShelter(e, markerModel) {
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
                        onClick: _onClickShelter,
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