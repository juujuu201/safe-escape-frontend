import {appModel} from "../model/AppModel.js";
import Define from "../common/Define.js";
import Constants from "../common/Constants.js";

export default class Util {
    static closeMapTooltip(centerModel = appModel.centerModel) {
        const markerTooltipModel = appModel.markerTooltipModel;

        if (markerTooltipModel) {
            markerTooltipModel.hide();
        }

        if (centerModel) {
            centerModel.deSelect();
        }
    }

    static cancelCongestionSetting(map) {
        if (!map) {
            return;
        }

        appModel.setValue("status", Constants.STATUS_TYPE.NONE);

        // 혼잡 지역 설정 중 표시하던 마커와 폴리곤을 지운다.
        for (const model of appModel.tempMarkerModels) {
            model.hide();
        }

        if (appModel.selectedPolygon) {
            appModel.selectedPolygon.setMap(null);
        }

        appModel.setValue("tempMarkerModels", []);
        appModel.setValue("selectedPolygon", null);

        // 지도를 다시 움직일 수 있도록 설정한다.
        map.setOptions(Define.MAP_MOVE_ENABLE_OPTIONS);
    }
}