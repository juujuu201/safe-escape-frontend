import {appModel} from "../model/AppModel.js";

export default class Util {
    static closeMapTooltip(centerModel) {
        const markerTooltipModel = appModel.markerTooltipModel;

        if (markerTooltipModel) {
            markerTooltipModel.hide();
        }

        if (centerModel) {
            centerModel.deSelect();
        }
    }
}