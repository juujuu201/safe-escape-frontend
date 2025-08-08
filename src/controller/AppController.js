import {appModel} from "../model/AppModel.js";

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

    static cancelCongestionSetting(map, isDeleteAll = false) {
        if (!map) {
            return;
        }

        // 혼잡 지역 설정 중 폴리곤을 지운다.
        for (const model of appModel.tempEdgeModels) {
            model.hide();
        }

        if (appModel.tempPolygonArea) {
            appModel.tempPolygonArea.setMap(null);
        }

        appModel.setValue("tempEdgeModels", []);
        appModel.setValue("tempPolygonArea", null);

        // 비상구 설정 중 표시하던 마커를 지운다.
        if (isDeleteAll) {
            for (const model of appModel.tempExitModels) {
                model.hide();
            }
        }

        appModel.setValue("tempExitModels", []);
    }

    static cancelExitSetting(map) {
        if (!map) {
            return;
        }

        // 혼잡 지역 설정 중 표시하던 마커와 폴리곤을 지운다.
        for (const model of appModel.tempExitModels) {
            model.hide();
        }

        appModel.setValue("tempExitModels", []);
    }
}