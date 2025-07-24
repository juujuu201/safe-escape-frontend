import { useState, useEffect } from "react";
import eventBus from "./EventBus.js";

/**
 * 특정 model 객체에서 key 상태를 구독하고 사용하는 훅
 * @param {Model} model - 상태를 갖고 있는 model 인스턴스
 * @param {String} key - 상태 키
 */
export function useModel(model, key) {
    const [state, setState] = useState(); // 초기값 없이

    useEffect(() => {
        if (model) {
            const handler = (newValue) => setState(newValue);
            eventBus.on(key, handler);

            // mount 직후 강제로 현재 값 한 번 설정
            setState(model.getValue(key));

            return () => eventBus.off(key, handler);
        }
    }, [model, key]);

    return state;
}