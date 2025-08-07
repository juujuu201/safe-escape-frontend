import eventBus from "../controller/EventBus.js";
import Constants from "../common/Constants.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import AppController from "../controller/AppController.js";

const _defaultMarkerIcon = `${Constants.IMAGE_URL}marker.svg`,
    _defaultMarkerSize = Define.MARKER_SIZE,
    _defaultZoomValue = Define.ZOOM,
    _settingStatus = Constants.STATUS_TYPE.CONGESTION_SETTING;

class Model {
    constructor() {
        this.isVisible = true;
    }

    getValue(key) {
        return this[key];
    }

    setValue(key, newValue) {
        if (!(key in this)) throw new Error(`Invalid key: ${key}`);

        this[key] = newValue;

        // 상태 변경 알림: 이벤트 버스 emit
        eventBus.emit(key, newValue);
    }
}

class AppModel extends Model {
    constructor() {
        super();

        this.map = null;
        this.centerModel = null;
        this.markerModels = [];
        this.markerTooltipModel = new MarkerTooltipModel();
        this.refreshBtnEnabled = false;

        this.status = Constants.STATUS_TYPE.NONE;
        this.menuButtonModels = [];
        this.tempMarkerModels = [];
        this.selectedPolygon = null;
    }

    removeMarker(model) {
        const idx = this.markerModels.indexOf(model);

        if (idx !== -1) {
            this.markerModels.splice(idx, 1);
        }
    }
}

export class MarkerModel extends Model {
    constructor(options = {}) {
        super();

        const {position, icon, iconSize, selectedColor, title, desc, onClick, onMouseOver, onMouseOut, map, naverMap, hasMarker} = options;

        if (!(position && map)) {
            return;
        }

        this._svgEl = null;
        this._hasMarker = hasMarker ?? true;
        this._icon = (this._hasMarker ? (icon ?? _defaultMarkerIcon) : null);

        this.position = position;
        this.iconUrl = this._icon;
        this.iconSize = iconSize ?? _defaultMarkerSize;
        this.selectedColor = selectedColor || Constants.COLORS.BLACK;
        this.title = title;
        this.desc = desc;
        this.selectState = "out";

        this.onClick = onClick;
        this.onMouseOver = onMouseOver;
        this.onMouseOut = onMouseOut;

        this.element = null;
        this.marker = null;
        this.map = map;
        this.naverMap = naverMap ?? window.naver;
    }

    _setIconUrl() {
        if (this._svgEl) {
            const serializer = new XMLSerializer(),
                updatedSvg = serializer.serializeToString(this._svgEl),
                base64 = btoa(unescape(encodeURIComponent(updatedSvg)));

            this.iconUrl = `data:image/svg+xml;base64,${base64}`;
        }
    }

    async setBgColor(color = this.selectedColor) {
        if (!this._svgEl) {
            await this.loadSVGIcon(this.iconUrl);
        }

        if (this._svgEl) {
            const bgColorEl = this._svgEl.querySelector(`#${Constants.MARKER_BG_ID}`);

            if (bgColorEl) {
                bgColorEl.setAttribute("fill", color);
            }

            this._setIconUrl();

            if (this.marker && this.iconUrl) {
                this.marker.setIcon({
                    url: this.iconUrl,
                    scaledSize: new this.naverMap.maps.Size(this.iconSize, this.iconSize),
                });
            }
        }
    }

    async loadSVGIcon(icon = this._icon) {
        if (!icon) {
            return null;
        }

        const res = await fetch(icon),
            svgText = await res.text(),
            parser = new DOMParser(),
            svgDoc = parser.parseFromString(svgText, "image/svg+xml");

        this._svgEl = svgDoc.querySelector("svg");
        this._svgEl.style.pointerEvents = "visiblePainted";
        this._setIconUrl();
    }

    attachEvents() {
        if (!this.marker) {
            return;
        }

        // [marker] click
        this.naverMap.maps.Event.addListener(this.marker, "click", e => {
            if (appModel.status !== _settingStatus) {
                this.setBgColor();

                if (this.selectState !== "click") {
                    this.setValue("selectState", "click");
                }

                if (this.onClick) {
                    this.onClick(e, this);
                }
            }
        });

        // [marker] mouseover
        this.naverMap.maps.Event.addListener(this.marker, "mouseover", e => {
            if (appModel.status !== _settingStatus && this.selectState !== "click") {
                this.setBgColor();
                this.setValue("selectState", "hover");

                if (this.onMouseOver) {
                    this.onMouseOver(e);
                }
            }
        });

        // [marker] mouseout
        this.naverMap.maps.Event.addListener(this.marker, "mouseout", e => {
            if (appModel.status !== _settingStatus && this.selectState !== "click") {
                this.deSelect();

                if (this.onMouseOut) {
                    this.onMouseOut(e);
                }
            }
        });

        // [map] center_changed
        this.naverMap.maps.Event.addListener(this.map, "center_changed", () => {
            const centerModel = appModel.getValue("centerModel"),
                markerTooltipModel = appModel.getValue("markerTooltipModel");

            if (centerModel) {
                const prevCenter = centerModel.position ?? Util.getLocationObj(Define.DEFAULT_LOCATION),
                    curCenter = this.map.getCenter();
                let distance;

                // 이전 센터와 현재 센터 간 거리가 1km 이상인 경우 새로고침 버튼 활성화
                if (prevCenter && curCenter) {
                    distance = Util.getDistanceBetweenCoord(prevCenter, curCenter);

                    if (distance >= 1000) {
                        appModel.setValue("refreshBtnEnabled", true);
                    }
                }

                // 툴팁이 열려있는 경우 닫기
                if (markerTooltipModel?.isVisible) {
                    AppController.closeMapTooltip(centerModel);
                }
            }
        });

        this._setIconUrl();
    }

    deSelect() {
        this.setValue("selectState", "out");
        this.setBgColor(Constants.COLORS.WHITE);
    }

    async show(isCenter = false) {
        if (this._icon) {
            await this.loadSVGIcon(this._icon);
        }

        if (this.iconUrl) {
            this.marker = new this.naverMap.maps.Marker({
                position: this.position,
                map: this.map,
                icon: {
                    url: this.iconUrl,
                    scaledSize: new this.naverMap.maps.Size(this.iconSize, this.iconSize)
                },
            });

            this.element = this.marker.eventTarget;
            this.element.setAttribute("id", Constants.MARKER_ID);

            this.attachEvents();
            this.marker.setPosition(this.position);

            if (isCenter) {
                if (this.map.getZoom() !== _defaultZoomValue) {
                    this.map.setOptions("zoom", _defaultZoomValue);
                }

                this.map.setCenter(this.position);
                appModel.setValue("centerModel", this);
            }
        }
    }

    hide() {
        if (this.marker) {
            this.marker.setMap(null);
        }
    }
}

class MarkerTooltipModel extends Model {
    constructor() {
        super();

        this.isVisible = false;
        this.title = "";
        this.desc = "";
        this.style = {};
    }

    show(markerModel) {
        const {title, desc, element} = markerModel;

        this.setValue("isVisible", true);
        this.setValue("title", title);
        this.setValue("desc", desc);

        if (element) {
            const {top, left} = element.getBoundingClientRect();

            this.setValue("style", {
                top: `${top}px`,
                left: `${left}px`
            });
        }
    }

    hide() {
        this.setValue("isVisible", false);
        this.setValue("title", "");
        this.setValue("desc", "");
    }
}

export class CongestionModel extends Model {
    constructor(options = {}) {
        super();

        const {position, level, map, naverMap} = options;

        if (position == null || level == null) {
            return;
        }

        this.position = position ?? Util.getLocationObj(Define.DEFAULT_LOCATION, naverMap);
        this.level = level ?? Constants.CROWDED_LEVEL.NORMAL;
        this.area = null;

        this.map = map;
        this.naverMap = naverMap;
    }

    show() {
        this.area = new this.naverMap.maps.Circle({
            center: this.position,
            map: this.map,
            radius: 1000,
            fillColor: Constants.COLORS.CROWDED_LEVEL[this.level.toUpperCase()],
            fillOpacity: 0.4,
            strokeOpacity: 0
        });

        this.area.setMap(this.map)
    }
}

export class MenuButtonModel extends Model {
    constructor(options = {}) {
        super();

        const {isVisible, isDisabled, desc, value} = options;

        this.isVisible = isVisible ?? false;
        this.isDisabled = isDisabled ?? true;
        this.desc = desc ?? "";
        this.value = value ?? null;
    }
}

export const appModel = new AppModel();