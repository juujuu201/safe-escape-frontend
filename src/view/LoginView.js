import {useState} from "react";
import {useNavigate} from "react-router-dom";
import Constants from "../common/Constants.js";
import {SEAlertDialog, SEFormInput, SETextButton} from "../widgets/Widgets.js";
import Resources from "../common/Resources.js";
import {Box} from "@mui/material";
import * as Requester from "../api/Requester.js";

const _viewNames = Constants.VIEW_NAMES;

const LoginView = () => {
    const [open, setOpen] = useState(false),
        navigate = useNavigate();

    async function _doLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget),
            email = formData.get(Constants.INPUT_NAMES.EMAIL),
            password = formData.get(Constants.INPUT_NAMES.PASSWORD),
            {code, data} = await Requester.doLogin(email, password);

        if (code === Constants.RESPONSE_CODE.OK) {
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToekn", data.refreshToekn);
            navigate("/main");
        } else {
            setOpen(true);
        }
    }

    function _onCloseDialog(e) {
        setOpen(false);
    }

    return (
        <div className={_viewNames.LOGIN_VIEW}>
            <Box component="form" onSubmit={_doLogin}>
                <SEFormInput name={Constants.INPUT_NAMES.EMAIL} type={Constants.INPUT_TYPES.EMAIL} label={Resources.EMAIL} placeholder={Resources.INPUT_EMAIL} required={true}/>
                <SEFormInput name={Constants.INPUT_NAMES.PASSWORD} type={Constants.INPUT_TYPES.PASSWORD} label={Resources.PASSWORD} placeholder={Resources.INPUT_PASSWORD}/>
                <SETextButton type={Constants.BUTTON_TYPES.SUBMIT} desc={Resources.LOGIN} color={Constants.COLORS.THEME}/>
            </Box>
            <SEAlertDialog title={Resources.ALERT} desc={Resources.LOGIN_ALERT_MSG} open={open} onClose={_onCloseDialog}/>
        </div>
    );
};

export default LoginView;