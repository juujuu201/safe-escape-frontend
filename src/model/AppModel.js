import eventBus from "../controller/EventBus.js";
import Constants from "../common/Constants.js";
import Define from "../common/Define.js";
import Util from "../common/Utils.js";
import AppController from "../controller/AppController.js";

const _defaultMarkerIcon = `${Constants.IMAGE_URL}marker.svg`,
    _defaultMarkerSize = Define.MARKER_SIZE,
    _statusType = Constants.STATUS_TYPE,
    _themeColor = Constants.COLORS.THEME;
let _modelIdCounter = 0;

function _addFloatingElement(id, model, saveProp = "", content = null, styleObj = {}) {
    if (id && model) {
        const overlay = new model.naverMap.maps.OverlayView();

        if (overlay) {
            const btnEl = document.createElement("div"),
                {className, left, top, leftAdjust, topAdjust} = styleObj;

            btnEl.setAttribute("id", id);
            btnEl.innerHTML = content;
            btnEl.addEventListener("click", e => {
                e.stopPropagation();

                model.remove();
            });

            if (className && model.element) {
                Util.addClass(model.element, className);
            }

            if (saveProp) {
                model[saveProp] = btnEl;
            }

            overlay.onAdd = () => {
                const pane = overlay.getPanes().floatPane;

                if (pane) {
                    pane.appendChild(btnEl);
                }
            };

            overlay.draw = () => {
                const projection = overlay.getProjection();

                if (projection) {
                    const position = new model.naverMap.maps.LatLng(left, top),
                        pixel = projection.fromCoordToOffset(position);

                    btnEl.style.left = `${pixel.x + leftAdjust ?? 0}px`;
                    btnEl.style.top = `${pixel.y + topAdjust ?? 0}px`;
                }
            };

            overlay.onRemove = () => {
                if (btnEl.parentNode) {
                    btnEl.parentNode.removeChild(btnEl);
                }
            };

            overlay.setMap(model.map);
        }
    }
}

class Model {
    constructor() {
        this._modelId = `model_${_modelIdCounter++}`; // 고유 ID 생성
    }

    modelId() {
        return this._modelId;
    }

    getEventKey(key) {
        return `${this._modelId}:${key}`; // 구독 키 예: "model_1:isVisible"
    }

    getValue(key) {
        return this[key];
    }

    setValue(key, newValue) {
        if (!(key in this)) throw new Error(`Invalid key: ${key}`);
        this[key] = newValue;

        const eventKey = this.getEventKey(key);
        eventBus.emit(eventKey, newValue);
    }
}

class AppModel extends Model {
    constructor() {
        super();

        this.selectedTab = Constants.MENU_NAMES.HOME;

        this.map = null;
        this.mapBounds = null;
        this.sideBarRef = null;
        this.curAddress = "";

        this.centerModel = null;
        this.markerTooltipModel = new MarkerTooltipModel();
        this.refreshBtnEnabled = false;
        this.showShelter = true;

        this.exitModels = [];
        this.polygonModels = [];
        this.congestionModels = [];
        this.shelterModels = [];

        this.status = Constants.STATUS_TYPE.NONE;
        this.menuButtonModels = [];
        this.messageValue = "";

        this.selectedExit = null;
        this.selectedPolygon = null;
        this.selectedShelter = null;
        this.routeInfo = {};

        this.tempEdgeModels = [];
        this.tempPolygonModel = null;
        this.tempExitModels = [];
    }

    isSettingStatus() {
        return (this.status === _statusType.CONGESTION_SETTING || this.status === _statusType.EXIT_SETTING);
    }

    isSelectedStatus() {
        return (this.status === _statusType.EXIT_SELECTED || this.status === _statusType.EXIT_SHELTER_SELECTED);
    }

    removeRoutes(isStartMarkerDeselect = true, isEndMarkerDeselect = true) {
        if (isStartMarkerDeselect) {
            appModel.selectedExit?.deSelect();
        }

        if (isEndMarkerDeselect) {
            appModel.selectedShelter?.deSelect();
        }

        if (!Util.isEmptyObject(this.routeInfo)) {
            const {routeLines} = this.routeInfo;

            for (const line of routeLines) {
                line.setMap(null);
            }
        }

        this.setValue("routeInfo", {});
    }

    removePolygon(polygonModel) {
        // 인자를 지정하지 않으면 모든 polygonModel을 삭제한다.
        if (polygonModel) {
            let idx;

            // 폴리곤 내 마커 삭제
            for (const marker of polygonModel.markers) {
                idx = appModel.exitModels.indexOf(marker);

                if (idx !== -1) {
                    appModel.exitModels.splice(idx, 1);
                    marker.hide();
                }
            }

            // 폴리곤 삭제
            idx = appModel.polygonModels.indexOf(polygonModel);

            if (idx !== -1) {
                appModel.polygonModels.splice(idx, 1);
                polygonModel.hide();
            }
        } else {
            for (const polygon of appModel.polygonModels) {
                for (const marker of polygon.markers) {
                    marker.hide();
                }

                polygon.hide();
            }

            appModel.setValue("polygonModels", []);
            appModel.setValue("exitModels", []);
        }
    }

    removeShelter(shelterModel) {
        // 인자를 지정하지 않으면 모든 shelterModel을 삭제한다.
        if (shelterModel) {
            const idx = appModel.shelterModels.indexOf(shelterModel);

            if (idx !== -1) {
                appModel.shelterModels.splice(idx, 1);
                shelterModel.hide();
            }
        } else {
            for (const shelter of appModel.shelterModels) {
                shelter.hide();
            }

            appModel.setValue("shelterModels", []);
        }
    }

    removeCongestion() {
        for (const congestion of appModel.congestionModels) {
            congestion.hide();
        }

        appModel.setValue("congestionModels", []);
    }

    getShelterModel(shelterId) {
        return this.shelterModels.find(model => model.id === shelterId) ?? null;
    }

    getExitModel(exitId) {
        return this.exitModels.find(model => model.id === exitId) ?? null;
    }
}

export class MarkerModel extends Model {
    constructor(options = {}) {
        super();

        const {position, icon, iconSize, selectedColor, title, desc, onClick, onMouseOver, onMouseOut,
            map, naverMap, hasMarker, removable, id} = options;

        if (!(position && map)) {
            return;
        }

        this.id = id ?? this.modelId();
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
        this.isRemovable = removable ?? false;

        this.onClick = onClick;
        this.onMouseOver = onMouseOver;
        this.onMouseOut = onMouseOut;

        this.element = null;
        this.marker = null;
        this.closeBtnEl = null;
        this.priorityEl = null;
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

        function _relocateTooltip() {
            const markerTooltipModel = appModel.getValue("markerTooltipModel");

            if (markerTooltipModel) {
                const {isVisible, isTextOnly} = markerTooltipModel;

                // text tooltip을 이동시킨다.
                if (isVisible && isTextOnly) {
                    markerTooltipModel.move(appModel.selectedExit);
                }
            }
        }

        // [marker] click
        this.naverMap.maps.Event.addListener(this.marker, "click", e => {
            if (!appModel.isSettingStatus()) {
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
            if (!appModel.isSettingStatus() && this.selectState !== "click") {
                this.setBgColor();
                this.setValue("selectState", "hover");

                if (this.onMouseOver) {
                    this.onMouseOver(e);
                }
            }
        });

        // [marker] mouseout
        this.naverMap.maps.Event.addListener(this.marker, "mouseout", e => {
            if (!appModel.isSettingStatus() && this.selectState !== "click") {
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
                if (markerTooltipModel) {
                    const {isVisible, isTextOnly} = markerTooltipModel;

                    if (isVisible && !isTextOnly) {
                        AppController.closeMapTooltip(centerModel);
                    }
                }
            }

            // 툴팁 위치를 재계산한다.
            _relocateTooltip();
        });

        // [map] idle
        this.naverMap.maps.Event.addListener(this.map, "idle", e => {
            // 툴팁 위치를 재계산한다.
            _relocateTooltip();

            if (appModel.selectedShelter) {
                appModel.selectedShelter.deSelect();
                appModel.setValue("selectedShelter", null);
            }
        });

        this._setIconUrl();
    }

    select() {
        this.setValue("selectState", "click");
        this.setBgColor(Constants.COLORS.BLACK);
    }

    deSelect(propName) {
        this.setValue("selectState", "out");
        this.setBgColor(Constants.COLORS.WHITE);

        if (propName) {
            appModel.setValue(propName, null);
        }
    }

    async show(isCenter = false) {
        if (document.body.contains(this.element)) {
            return;
        }

        if (this._icon) {
            await this.loadSVGIcon(this._icon);
        }

        if (this.iconUrl) {
            // marker
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

            // marker close 버튼
            if (this.isRemovable) {
                _addFloatingElement(Constants.MARKER_CLOSE_BUTTON_ID, this, "closeBtnEl", "&times;", {
                    className: Constants.REMOVABLE_CLASS,
                    left: this.position.lat(),
                    top: this.position.lng(),
                    leftAdjust: 8,
                    topAdjust: -55
                });
            }

            this.attachEvents();
            this.marker.setPosition(this.position);
        }

        if (isCenter) {
            this.map.setCenter(this.position);
            appModel.setValue("centerModel", this);
            appModel.setValue("refreshBtnEnabled", false);
        }
    }

    hide() {
        if (this.marker) {
            if (this.closeBtnEl) {
                this.closeBtnEl.remove();
            }

            this.marker.setMap(null);
        }
    }

    remove() {
        const exitModels = appModel.tempExitModels,
            idx = exitModels.indexOf(this);

        if (idx !== -1) {
            exitModels.splice(idx, 1);
            appModel.setValue("tempExitModels", exitModels);

            this.closeBtnEl.remove();
            this.marker.setMap(null);
        }
    }

    showPriority(priority) {
        _addFloatingElement(Constants.EXIT_PRIORITY_CLASS, this, "priorityEl", String(priority), {
            className: null,
            left: this.position.lat(),
            top: this.position.lng(),
            leftAdjust: 15,
            topAdjust: -60
        });
    }
}

export class PolygonModel extends Model {
    constructor(options = {}) {
        super();

        const {position, onClick, map, naverMap, pathList, strokeColor, fillColor, fillOpacity, markers, id} = options;

        this.id = id
        this.polygon = null;
        this.element = null;

        this.pathList = pathList ?? [];
        this.position = position;
        this.onClick = onClick;
        this.strokeColor = strokeColor ?? _themeColor;
        this.fillColor = fillColor ?? _themeColor;
        this.fillOpacity = fillOpacity ?? 0.2;

        this.map = map;
        this.naverMap = naverMap ?? window.naver;

        this.markers = markers ?? [];
    }

    show(isOnlyShow = false) {
        if (!isOnlyShow) {
            if (this.polygon) {
                this.polygon.setMap(null);
            }

            this.polygon = new this.naverMap.maps.Polygon({
                paths: Util.sortPointsClockwise(this.pathList),
                strokeColor: this.strokeColor,
                fillColor: this.fillColor,
                fillOpacity: this.fillOpacity
            });

            this.element = this.polygon.getShape().element;
            this.element.setAttribute("id", Constants.CONGESTION_AREA_ID);

            if (this.onClick) {
                this.element.addEventListener("click", e => {
                    this.onClick(e, this);
                });
            }
        }

        this.polygon.setMap(this.map);
    }

    addPath(path) {
        this.setValue("pathList", [...this.pathList, ...[path]])
    }

    addMarkers(markers) {
        let newMarkers = [];

        if (markers instanceof  Array) {
            newMarkers = [...this.markers, ...markers];
        } else {
            newMarkers.push(markers);
        }

        this.setValue("markers", newMarkers);
    }

    hide() {
        if (this.polygon) {
            this.polygon.setMap(null);
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
        this.isTextOnly = false;
    }

    show(markerModel, isTextOnly = false) {
        const {title, desc} = markerModel;

        this.setValue("isVisible", true);
        this.setValue("title", isTextOnly ? "" : title);
        this.setValue("desc", desc);
        this.move(markerModel);

        if (this.isTextOnly !== isTextOnly) {
            this.setValue("isTextOnly", isTextOnly);
        }

        if (!isTextOnly) {
            const element = markerModel.element,
                {top, left} = element.getBoundingClientRect();

            this.setValue("style", {
                top: `${top}px`,
                left: `${left + 13}px`
            });
        }
    }

    hide() {
        this.setValue("isVisible", false);
        this.setValue("title", "");
        this.setValue("desc", "");
    }

    move(markerModel) {
        const element = markerModel.element;

        if (element) {
            const {top, left} = element.getBoundingClientRect();

            this.setValue("desc", markerModel.desc);
            this.setValue("style", {
                top: `${top}px`,
                left: `${left}px`
            });
        }
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
        this.naverMap = naverMap ?? window.naver;
    }

    show() {
        this.area = new this.naverMap.maps.Circle({
            center: this.position,
            map: this.map,
            radius: 250,
            fillColor: Constants.COLORS.CROWDED_LEVEL[this.level.toUpperCase()],
            fillOpacity: 0.4,
            strokeOpacity: 0
        });

        this.area.setMap(this.map)
    }

    hide() {
        if (this.area) {
            this.area.setMap(null);
        }
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