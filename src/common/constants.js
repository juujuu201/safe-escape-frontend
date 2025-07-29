const Constants = {
    /* VIEW NAMES */
    VIEW_NAMES: {
        DOCUMENT: "document",
        MENU_BAR: "menu_bar",
        CONTENTS_AREA: "contents_area",
        TITLE_BAR: "title_bar",
        MAP_AREA: "map_area",
        SIDE_BAR: "side_bar",
    },

    /* WIDGET NAMES */
    WIDGET_NAMES: {
        IMAGE_BUTTON: "image_button",
        ICON_BUTTON: "icon_button",
        TEXT_BUTTON: "text_button",
        TAB: "tab",
        TAB_BUTTON: "tab_button",
        TAB_PANEL: "tab_panel",
        TEXT: "text",
        IMAGE: "image",
        MAP_TOOLTIP: "map_tooltip"
    },

    /* MENU NAMES */
    MENU_NAMES: {
        HOME: "home",
        CONGESTION: "congestion"
    },

    /* COLORS */
    COLORS: {
        THEME: "#006F13",
        RED: "#ED1C25",
        BLACK: "#000000",
        WHITE: "#FFFFFF",

        CROWDED_LEVEL: {
            FREE: "#C1FFB9",
            NORMAL: "#FEFFAE",
            CROWDED: "#FFBCA1",
            VERY_CROWDED: "#FF9E9E"
        }
    },

    /* WIDGET CLASSES */
    TITLE_CLASS: "title",
    SUBTITLE_CLASS: "sub_title",
    DESCRIPTION_CLASS: "description",
    TAB_TEXT_CLASS: "tab_text",

    /* CLASSES */
    DISABLED_CLASS: "disabled",

    LOGO_TAB_BUTTON: "logo_tab_button",
    MENU_TAB: "menu_tab",
    HOME_TAB_BUTTON: "home_tab_button",
    CONGESTION_TAB_BUTTON: "congestion_tab_button",
    MAP_TOOLTIP_CONTENT: "map_tooltip_content",
    SHELTER_LIST_CLASS: "shelter_list",
    REFRESH_BTN_CLASS: "refresh_btn",

    /* ID */
    MAP_AREA_ID: "map_area",
    MARKER_BG_ID: "marker_bg",

    /* MAP OPTION KEYS*/
    MAP_OPTION_KEYS: {
        DEFAULT_LOCATION: "center",
        DISABLE_DOUBLE_CLICK_ZOOM: "disableDoubleClickZoom",
        DISABLE_DOUBLE_TAP_ZOOM: "disableDoubleTapZoom",
        DISABLE_TWO_FINGER_TAP_ZOOM: "disableTwoFingerTapZoom",
        LOGO_CONTROL: "logoControl",
        MAP_DATA_CONTROL: "mapDataControl",
        SCALE_CONTROL: "scaleControl",
        ZOOM: "zoom"
    },

    /* VALUES */
    IMAGE_URL: "/images/",
    EARTH_R: 6371000,
    CROWDED_LEVEL: {
        FREE: "free",
        NORMAL: "normal",
        CROWDED: "crowded",
        VERY_CROWDED: "very_crowded"
    }
};

export default Constants;