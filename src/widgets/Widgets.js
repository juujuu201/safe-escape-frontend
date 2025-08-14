import {useRef, useState, useEffect} from "react";
import Constants from "../common/Constants.js";
import Resources from "../common/Resources.js";
import Util from "../common/Utils.js";
import {Box, ButtonBase, IconButton, Tab, Tabs, Tooltip, Typography, FormControl, FormLabel, Input, Dialog, DialogContent,
    List, ListItemButton, ListItemText, ClickAwayListener} from "@mui/material";
import {Close} from "@mui/icons-material";

const _widgetNames = Constants.WIDGET_NAMES;

/**
 *
 * @param {String} orgClassName             - 기존 className
 * @param {String|Array} newClassName       - 추가할 className
 * @returns {String}
 * @private
 */
function _extendClassName(orgClassName, newClassName) {
    if (!newClassName) {
        return orgClassName || "";
    } else if (!orgClassName) {
        return newClassName || "";
    }

    const classList = orgClassName.split(" ");

    if (typeof newClassName === "string") {
        newClassName = [newClassName];
    }

    for (const name of newClassName) {
        classList.push(name);
    }

    return classList.join(" ");
}

function _getClassList(className) {
    let classList = className;

    if (typeof classList === "string") {
        classList = classList.split(" ");
    }

    return classList;
}

/**************************************************
 * Widgets
 **************************************************/
export const SEImage = (props) => {
    const {image, altText, className} = props;

    return (
        <div className={_extendClassName(_widgetNames.IMAGE, className)}>
            <Box component="img" src={image} alt={altText}/>
        </div>
    );
};

export const SEImageButton = (props) => {
    const {image, onClick, altText, className} = props;

    return (
        <div className={_extendClassName(_widgetNames.IMAGE_BUTTON, className)}>
            <ButtonBase onClick={onClick}>
                <Box component="img" src={image} alt={altText}/>
            </ButtonBase>
        </div>
    );
};

export const SETextButton = (props) => {
    const {
        title = "",
        desc = "",
        isDisabled = false,
        isVisible = true,
        type = Constants.BUTTON_TYPES.BUTTON,
        className, onClick, value
    } = props;
    let orgClassName = _widgetNames.TEXT_BUTTON,
        titleEl, descEl;

    if (!isVisible) {
        return null;
    }

    if (title) {
        titleEl = <SEText className={Constants.SUBTITLE_CLASS} desc={title}/>;
    }

    if (desc) {
        descEl = <SEText className={Constants.DESCRIPTION_CLASS} desc={desc}/>;
    }

    if (isDisabled) {
        orgClassName = `${orgClassName} ${Constants.DISABLED_CLASS}`;
    }

    return (
        <div className={_extendClassName(orgClassName, className)}>
            <ButtonBase type={type} onClick={onClick} disabled={isDisabled} value={value}>
                <Box>
                    {titleEl}
                    {descEl}
                </Box>
            </ButtonBase>
        </div>
    );
};

export const SEIconButton = (props) => {
    const {caption, desc, icon, className, onClick, sx} = props;
    let iconButtonEl = <IconButton sx={sx}>{icon}</IconButton>,
        descEl;

    if (caption) {
        iconButtonEl = <Tooltip title={caption}>{iconButtonEl}</Tooltip>;
    }

    if (desc) {
        descEl = <div>{desc}</div>;
    }

    return (
        <div className={_extendClassName(_widgetNames.ICON_BUTTON, className)} onClick={onClick}>
            {iconButtonEl}
            {descEl}
        </div>
    );
};

export const SETab = (props) => {
    const {
            descVisible = false,
            tabInfoList, direction, defaultTab, className, onChange
        } = props,
        tabNameList = tabInfoList.map(tab => tab.name),
        [curTabIdx, setTabIdx] = useState(tabNameList.indexOf(defaultTab) ?? -1),
        tabList = [];
    let classList = _getClassList(className) || [],
        tabPanel;

    for (const tabInfo of tabInfoList) {
        const {name, image, icon, panel} = tabInfo,
            attr = {};

        if (image) {
            attr["label"] = <img alt={name} src={image}/>;
        }

        if (icon) {
            attr["icon"] = icon;
        }

        if (descVisible) {
            const desc = Resources[name.toUpperCase()];

            if (desc) {
                if (attr.hasOwnProperty("label")) {
                    attr["label"] = (
                        <>
                            {attr["label"]}
                            <span className={Constants.TAB_TEXT_CLASS}>{desc}</span>
                        </>
                    );
                } else {
                    attr["label"] = desc;
                }
            }
        }

        tabList.push(<Tab key={`${name}_tab`} {...attr}/>);

        if (tabNameList[curTabIdx] === name) {
            tabPanel = <SETabPanel value={name} children={panel}/>;
        }
    }

    if (direction === "vertical") {
        classList.push(direction);
    }

    function _handleChange(e, curIdx) {
        let isStopEvent = false;

        if (onChange) {
            isStopEvent = onChange(e, tabNameList[curIdx]);
        }

        if (isStopEvent) {
            return;
        }

        setTabIdx(curIdx);
    }

    return (
        <div className={_extendClassName(_widgetNames.TAB, classList)}>
            <Box sx={{borderBottom: 1}}>
                <Tabs value={curTabIdx} orientation={direction} onChange={_handleChange}>
                    {tabList}
                </Tabs>
            </Box>
            {tabPanel}
        </div>
    );
};

export const SETabPanel = (props) => {
    const {children, value, className} = props;

    return (
        <div className={_extendClassName(_widgetNames.TAB_PANEL, className)} role="tabpanel" value={value}>
            {children}
        </div>
    );
};

export const SEText = (props) => {
    const {desc, color, size, align, className, hasUnderline = false} = props;
    let styleProps;

    if (hasUnderline) {
        styleProps = {
            sx: {
                textDecoration: "underline"
            }
        };
    }

    return (
        <div className={_extendClassName(_widgetNames.TEXT, className)}>
            <Typography color={color || Constants.COLORS.THEME} variant={size} align={align} {...styleProps}>{desc}</Typography>
        </div>
    );
};

export const SEMapTooltip = (props) => {
    const {
            isOpen = false,
            isTextOnly = false,
            image, title, desc, className, onClose, style, ref
        } = props,
        classList = _getClassList(className) || [];

    function _onClose() {
        if (onClose) {
            onClose();
        }
    }

    if (!isOpen) {
        return null;
    }

    if (isTextOnly) {
        classList.push(Constants.TEXT_ONLY_CLASS);
    }

    return (
        <div ref={ref} className={_extendClassName(_widgetNames.MAP_TOOLTIP, classList)} style={style}>
            {!isTextOnly &&
                <IconButton onClick={_onClose}>
                    <Close fontSize="small"/>
                </IconButton>}
            <div className={Constants.MAP_TOOLTIP_CONTENT}>
                {(!isTextOnly && image) && <SEImage image={image}/>}
                <div>
                    {(!isTextOnly && title) && <SEText className={Constants.SUBTITLE_CLASS} desc={title}/>}
                    {desc && <SEText className={Constants.DESCRIPTION_CLASS} desc={desc}/>}
                </div>
            </div>
        </div>
    );
};

export const SEMessageBar = (props) => {
    const {
            isVisible = false,
            desc, buttonDesc, onButtonClick, className
        } = props,
        classList = _getClassList(className) || [];

    if (!isVisible) {
        classList.push(Constants.INVISIBLE_CLASS);
    }

    return (
        <div className={_extendClassName(_widgetNames.MESSAGE_BAR, classList)}>
            <SEText desc={desc} color={Constants.COLORS.WHITE} size="h6"/>
            {buttonDesc && <SETextButton desc={buttonDesc} onClick={onButtonClick}/>}
        </div>
    );
};

export const SEFormInput = (props) => {
    const {label, name, placeholder, required, type, disabled, className} = props;

    return (
        <div className={_extendClassName(_widgetNames.FORM_INPUT, className)}>
            <FormControl>
                <FormLabel htmlFor={name}>{label}</FormLabel>
                <Input name={name} required={required} placeholder={placeholder} type={type} disabled={disabled}/>
            </FormControl>
        </div>
    )
};

export const SEAlertDialog = (props) => {
    const {open, onClose, title, desc, className} = props;

    function _onClose(e) {
        onClose && onClose();
    }

    return (
        <Dialog className={_extendClassName(_widgetNames.ALERT_DIALOG, className)} open={open} onClose={_onClose}>
            <DialogContent>
                <SEImage image={`${Constants.IMAGE_URL}info.svg`}/>
                <div>
                    <SEText className={Constants.DIALOG_TITLE} desc={title} size="h5"/>
                    <SEText className={Constants.DIALOG_DESC} desc={desc}/>
                    <SETextButton desc={Resources.CONFIRM} onClick={_onClose}/>
                </div>
            </DialogContent>
        </Dialog>
    )
};

export const SEInputText = (props) => {
    const {
            hasList = false,
            listData = [],
            inputClassName, name, placeholder, type, disabled, onChange, onFocus,
            listClassName, keyProp, titleProp, descProp, onListClose, onClickListItem
        } = props,
        inputRef = useRef(null),
        listRef = useRef(null),
        [isFocus, setFocus] = useState(false);
    let listChildren = null;

    function _onClose(e) {
        if (inputRef.current) {
            inputRef.current.blur();
        }

        setFocus(false);
        onListClose && onListClose();
    }

    function _onFocus(e) {
        setFocus(true);
        onFocus && onFocus(e);
    }

    function _onClickListItem(e, data) {
        onClickListItem && onClickListItem(data);
        _onClose();
    }

    function _onClickOutside(e) {
        if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) {
            _onClose();
        }
    }

    function _onKeyDown(e) {
        if (e.key === "Escape" && isFocus) {
            _onClose();
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", _onKeyDown);
        document.addEventListener("mousedown", _onClickOutside);

        return () => {
            document.removeEventListener("keydown", _onKeyDown);
            document.removeEventListener("mousedown", _onClickOutside);
        };
    }, [isFocus]);

    if (hasList && listData.length > 0) {
        listChildren = (
            <ClickAwayListener onClickAway={_onClickOutside}>
                <List className={_extendClassName(_widgetNames.LIST, listClassName)} ref={listRef} tabIndex={0}>
                    {listData.map(data => (
                        <ListItemButton key={data[keyProp]} onClick={e => _onClickListItem(e, data)}>
                            <ListItemText className={Constants.LIST_ITEM_TITLE_DESC_CLASS}>{data[titleProp]}</ListItemText>
                            {data[descProp] && <ListItemText className={Constants.LIST_ITEM_SUB_DESC_CLASS}>{data[descProp]}</ListItemText>}
                        </ListItemButton>
                    ))}
                </List>
            </ClickAwayListener>
        );
    }

    return (
        <div className={_extendClassName(_widgetNames.INPUT_TEXT, inputClassName)}>
            <Input name={name} inputRef={inputRef} type={type || Constants.INPUT_TYPES.TEXT} placeholder={placeholder}
                   disabled={disabled} onChange={onChange} onFocus={_onFocus}/>
            {listChildren}
        </div>
    )
};