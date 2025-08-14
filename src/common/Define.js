const Define = {
    /* NAVER MAP API VALUES*/
    DEFAULT_LOCATION: {
        latitude: 37.5666103,
        longitude: 126.9783882
    },

    DISABLE_DOUBLE_CLICK_ZOOM: true,            // 사용자가 지도 위에서 마우스 버튼을 더블 클릭해 지도를 확대하는 기능의 사용 여부
    DISABLE_DOUBLE_TAP_ZOOM: true,              // 사용자가 지도 위에서 한 손가락으로 더블 탭해 지도를 확대하는 기능의 사용 여부
    DISABLE_TWO_FINGER_TAP_ZOOM: true,          // 사용자가 지도 위에서 두 손가락으로 두 번 탭해 지도를 축소하는 기능의 사용 여부
    LOGO_CONTROL: true,                         // NAVER 로고 컨트롤의 표시 여부
    MAP_DATA_CONTROL: false,                    // 지도 데이터 저작권 컨트롤의 표시 여부
    ZOOM: 15,                                   // 지도의 초기 줌 레벨
    SCALE_CONTROL: false,                       // 지도 축척 컨트롤의 표시 여부

    MARKER_SIZE: 50,

    MAP_MOVE_ENABLE_OPTIONS: {
        draggable: true,
        pinchZoom: true,
        scrollWheel: true,
        keyboardShortcuts: true,
        disableDoubleClickZoom: false
    },

    /* TMAP MAP API VALUES */
    TMAP_APP_KEY: "td01seMWLm12czMxGBVSD5exSc9JaoZO1Epqih7c",
    REQUEST_URL: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1",
    REQ_COORD_TYPE: "WGS84GEO",                 // 출발지, 경유지, 목적지 좌표계 유형
    RES_COORD_TYPE: "WGS84GEO",                 // 응답 좌표계 유형
    WALKING_SPEED: 10,                          // 진행속도(Km/h)
    SEARCH_OPTION: "0",                         // 경로 탐색 옵션 (0: 추천(default) / 4: 추천 + 대로 우선 / 10: 최단 / 30: 최단 거리 + 계단 제외)
    START_NAME: "출발지",
    END_NAME: "도착지"
};

export default Define;