const Constants = {
    /* VIEW NAMES */
    VIEW_NAMES: {
        DOCUMENT: "document",
        MENU_BAR: "menu_bar",
        CONTENTS_AREA: "contents_area",
        TITLE_BAR: "title_bar",
        MAP_AREA: "map_area",
        SIDE_BAR: "side_bar",

        LOGIN_VIEW: "login_view"
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
        MAP_TOOLTIP: "map_tooltip",
        MESSAGE_BAR: "message_bar",
        INPUT_TEXT: "input_text",
        ALERT_DIALOG: "alert_dialog"
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

    /* WIDGET PROPS */
    INPUT_TYPES: {
        TEXT: "text",
        EMAIL: "email",
        PASSWORD: "password",
        TEL: "tel"
    },
    INPUT_NAMES: {
        EMAIL: "email",
        PASSWORD: "password"
    },
    BUTTON_TYPES: {
        BUTTON: "button",
        SUBMIT: "submit",
        RESET: "reset"
    },

    /* WIDGET CLASSES */
    TITLE_CLASS: "title",
    SUBTITLE_CLASS: "sub_title",
    DESCRIPTION_CLASS: "description",
    TAB_TEXT_CLASS: "tab_text",
    DIALOG_TITLE: "dialog_title",
    DIALOG_DESC: "dialog_desc",

    /* CLASSES */
    DISABLED_CLASS: "disabled",
    INVISIBLE_CLASS: "invisible",
    SELECTING_CLASS: "selecting",
    REMOVABLE_CLASS: "removable",
    SELECTED_CLASS: "selected",

    LOGO_TAB_BUTTON: "logo_tab_button",
    MENU_TAB: "menu_tab",
    HOME_TAB_BUTTON: "home_tab_button",
    CONGESTION_TAB_BUTTON: "congestion_tab_button",
    MAP_TOOLTIP_CONTENT: "map_tooltip_content",
    SHELTER_LIST_CLASS: "shelter_list",
    REFRESH_BTN_CLASS: "refresh_btn",
    CONGESTION_MENU_AREA_CLASS: "congestion_menu_area",
    EXIT_PRIORITY_CLASS: "exit_priority",

    /* ID */
    MAP_AREA_ID: "map_area",
    MARKER_BG_ID: "marker_bg",
    MARKER_ID: "marker",
    MARKER_CLOSE_BUTTON_ID: "marker_close_button",
    CONGESTION_AREA_ID: "congestion_area",

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
    },
    STATUS_TYPE: {
        NONE: "none",
        CONGESTION_SETTING: "congestion_setting",
        EXIT_SETTING: "exit_setting",
        CONGESTION_SELECTED: "congestion_selected" ,
        EXIT_SELECTED: "exit_selected"
    },
    CONGESTION_BUTTON_VALUES: {
        SET_CONGESTION: "congestion_setting",
        WALKING_DISTANCE: "walking_distance",
        FIND_SHELTER: "find_shelter",
        RECOMMEND_EXIT: "recommend_exit",
        CANCEL_CONGESTION_SETTING: "cancel_congestion_setting",
        SET_EXIT: "set_exit",
        RESET_EXIT: "reset_exit",
        FINISH_EXIT: "finish_exit"
    },
    MAX_CONGESTION_MARKER: 10
};

export default Constants;