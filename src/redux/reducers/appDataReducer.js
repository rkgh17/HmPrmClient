/**
 * @file	appDataReducer.js
 * @date	2023.11.03
 * @author	yomile
 * @brief	App 데이터에 대한 Reducer 파일
 */
 import { SET_APP_DATA,SET_CHECK_PERMISSION, SET_STATUS_BAR, SET_STATUS_BAR_COLOR } from '../actionType';
 import { consts, colors} from "~/common/libs/base";
 import Config from 'react-native-config';

 const INITIAL_STATE = {
	baseUrl						: Config.BASE_URL,
	authPage					: Config.AUTH_PAGE,
	checkPermission				: false,
	permissionPage				: Config.PERMISSION_PAGE,
	androidPermissions			: JSON.parse(Config.ANDROID_PERMISSIONS),
	androidExtendPermissions	: JSON.parse(Config.ANDROID_EXTEND_PERMISSIONS),
	iosPermissions				: JSON.parse(Config.IOS_PERMISSIONS),
	iosExtendPermissions		: JSON.parse(Config.IOS_EXTEND_PERMISSIONS),
	statusBarColor				: colors.STATUS_BAR,
	statusBarStyle				: consts.STATUS_BAR_STYLE_DARK_CONTENT,
	deviceId					: null,
	deviceModel					: null,
	appVersion					: null,
	osType						: null,
	osVersion					: null,
	pushTokenId					: null
 };
 
 /**
  * App 데이터 대한 Reducer 함수
  * @param {*} state 
  * @param {*} action 
  * @returns 
  */
 export default function (state = INITIAL_STATE, action)
 {
	
	switch (action.type)
	{
		case SET_APP_DATA			: return {...state, ...action.payload };
		case SET_CHECK_PERMISSION	: return {...state, checkPermission : action.payload }	
		case SET_STATUS_BAR			: 
		return {...state, statusBarColor : action.payload.statusBarColor, statusBarStyle : action.payload.statusBarStyle	};
		case SET_STATUS_BAR_COLOR	: return {...state, statusBarColor : action.payload }
		default:
			return state;
	}
 }