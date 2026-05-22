/**
 * @file	appDataAction.js
 * @date	2023.11.03
 * @author	yomile
 * @brief	App 데이터에 대한 액션처리 파일
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import mosaic from '~/common/libs/mosaic/mosaic';
import { SET_APP_DATA, SET_CHECK_PERMISSION, SET_STATUS_BAR, SET_STATUS_BAR_COLOR } from '../actionType';
 
 /**
  * App 데이터를 설정한다.
  * @param {*} arrOption 옵션
  * @returns 
  */
 export const setAppData = (arrOption) => async(dispatch) => {
	dispatch({ type: SET_APP_DATA, payload: arrOption });
 }
 
 export const getAppData = ()=> async(dispatch, getState) => {
	
	//console.log("@@@@@@@@@@@@@@@@@@@@@@@@ getAppData @@@@@@@@@@@ getState().appData:"+ getState().appData);
	
	return getState().appData;
}

export const loadAppDataFromStorage = ()=> async(dispatch, getState) => {

	const strAppData = await AsyncStorage.getItem("appData");
	if(mosaic.string.isNullOrEmpty(strAppData) == false)
	{
		console.log("- loadAppDataFromStorage(), 스토리지에 App정보가 있음, strAppData:"+ strAppData);
		let objAppData = JSON.parse(strAppData);
		dispatch({ type: SET_APP_DATA, payload: objAppData });
	}
}

/**
 * 퍼미션 체크 여부값을 설정한다.
 * @param {*} 퍼미션 체크 여부값
 * @returns 
 */
export const setCheckPermission = (boolCheckPermission) => async(dispatch, getState) => {
	console.log("*appDtaAction.setCheckPermission");
	let boolPrevCheckPermssion = getState().appData.checkPermission;
	console.log(" -CheckPermission:"+ boolCheckPermission);
	console.log(" -PrevCheckPermssion:"+ boolPrevCheckPermssion);

	if(boolPrevCheckPermssion != boolCheckPermission)
	{
		console.log("퍼미션 체크 여부 업데이트");
		dispatch({ type: SET_CHECK_PERMISSION, payload: boolCheckPermission });
		AsyncStorage.setItem("appData", JSON.stringify(getState().appData));
	}
}

/**
 * 상태바를 설정한다.
 * @param {*} 상태바
 * @returns 
 */
export const setStatusBar = (objData) => async(dispatch, getState) => {

	let strPrevColor			= getState().appData.statusBarColor;
	let strPrevStatusBarStyle	= getState().appData.statusBarStyle;
	let strColor				= objData.statusBarColor;
	let strStatusBarStyle		= objData.statusBarStyle;
	
	if(strPrevColor != strColor || strPrevStatusBarStyle != strStatusBarStyle)
	{
		console.log("상태바 업데이트");
		dispatch({ type: SET_STATUS_BAR, payload: objData });
	}
}
	 
/**
 * 상태바 색상을 설정한다.
 * @param {*} 상태바 색상
 * @returns 
 */
export const setStatusBarColor = (strColor) => async(dispatch, getState) => {

	let strPrevColor = getState().appData.statusBarColor;
	if(strPrevColor != strColor)
	{
		dispatch({ type: SET_STATUS_BAR_COLOR, payload: strColor });
	}
}
