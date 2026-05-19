/**
 * @file	Main.js
 * @date	2025.04.07
 * @author	yomile
 * @brief	메인 화면 파일
 */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet, BackHandler, ActivityIndicator, TouchableOpacity, AppState } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from "react-redux";
import { colors, consts} from "~/common/libs/base";
import mosaic from '~/common/libs/mosaic/mosaic';
import AppStatusBar from "~/components/AppStatusBar";
import DeviceInfo from "react-native-device-info";
//import CookieManager from '@preeternal/react-native-cookie-manager';
//import { CookieManager } from 'react-native-nitro-cookies';
import NitroCookies from 'react-native-nitro-cookies';
import SendIntentAndroid from "react-native-send-intent";
import {WebView} from "react-native-webview";
import { showDialog, hideDialog } from "~/redux/actions/dialogAction";
import { setStatusBar } from "~/redux/actions/appDataAction";
import { pushMsgInit } from '~/redux/actions/pushDataAction'
 import Config from 'react-native-config';
 /**
  * 메인화면 클래스
  * @author	yomile
  * @version	1.0
  * @see <pre>
  *  == 개정이력(Modification Information) ==
  *   
  *   수정일      수정자           수정내용
  *  -------    --------    ---------------------------
  *   2025.04.07  yomile          최초 생성
  * 
  * </pre>
  */
 class Main extends PureComponent
 {
	/**
	 * 생성자
	 * @param {*} props  프로퍼티
	 */	
	constructor(props)
	{
		super(props);
		const { baseUrl, authPage } = this.props.appData;
		this.mBoolExitApp		= false;
		this.mClsBackHandler	= null;
		this.mStrUserAgent		= "Hmprm/"+ props.route?.params?.deviceId;

		this.state = {
			sourceUrl			: baseUrl + authPage,
			currentUrl			: baseUrl + authPage,
			canGoBack			: false,
			isConnected			: true,
			isLoading			: false,
		};
	}
 

	/**
	 * componentDidMount 이벤트
	 */
	async componentDidMount()
	{
		console.log("*Main.componentDidMount")
		// 백버튼 핸들러 등록
		this.mClsBackHandler = BackHandler.addEventListener("hardwareBackPress", this.onBackPressed);

	}

	componentDidUpdate(prevProps)
	{
		console.log("*Main.componentDidUpdate()");
		//console.log(" -prevProps.route.params:"+JSON.stringify(prevProps.route.params));
		//console.log(" -this.props.route.params:"+JSON.stringify(this.props.route.params));
		if(prevProps.route.params !== this.props.route.params)
		{
			console.log(" -경로파라미터 :"+ JSON.stringify(this.props.route.params));
			this.sendPostMessage(this.props.route.params); //send msg browser
		}

		if(prevProps.pushData.arrived == false && this.props.pushData.arrived == true)
		{
			// 백그라운드에서 넘어온 푸시데이터처리 
			console.log(" -푸시데이터:"+ JSON.stringify(this.props.pushData));
			this.setPushLinkUrl(this.props.pushData.data);
			this.props.dispatch(pushMsgInit());
		}
	}

	setPushLinkUrl  = (objData) => {
		console.log("*Main.setPushLinkUrl(), Data:"+ JSON.stringify(objData));
		let strLink = objData.ref;
		console.log("strLink:"+strLink);
		if( strLink.indexOf("hmprm://")  > -1)
		{
			var strUrl = Config.BASE_URL + strLink.substr(strLink.indexOf('://') + 2);
			console.log(" -Url:"+ strUrl +", currentUrl:"+ this.state.currentUrl);

			/*
			// 현재 동일한 URL인경우 릴로드 
			if(this.state.currentUrl === strUrl)
			{
				console.log(" -릴로드");
				this.postMessage(consts.MSG_GET_PUSH_DATA, objData);
				//if (this.refWebView != null) this.refWebView.reload();	
				
			}
			else
			{
				this.setState({ sourceUrl: strUrl, currentUrl: strUrl });
			}*/
			// 웹뷰로 전송하여 웹뷰에서 데이터롤 다시 가져오
			this.postMessage(consts.MSG_GET_PUSH_DATA, JSON.stringify(objData));
			this.setState({ sourceUrl: strUrl, currentUrl: strUrl });
			
		}
		else
		{
			this.setState({ sourceUrl: strLink, currentUrl: strLink });
		}
	}

	sendPostMessage(objData)
	{
		if (this.refWebView != null)
		{
			let strData = JSON.stringify(objData);
			console.log(" -sendPostMessage(), data:"+ strData);
			this.refWebView.postMessage(strData);
		}
	}

	/**
	 * componentWillUnmount 이벤트
	 */
	componentWillUnmount()
	{
		this.mBoolExitApp = false;

		if(this.mClsBackHandler != null)
		{
			this.mClsBackHandler.remove();
			this.mClsBackHandler = null;
		}
	}
 
	/**
	 * 백버튼 눌렀을때 이벤트
	 * @returns 
	 */
	onBackPressed = () => {
		console.log("*Main.onBackPressed(), this.state.canGoBack:"+ this.state.canGoBack);

		if (this.state.canGoBack)
		{
			console.log(" -Go Back");
			if(this.refWebView != null) this.refWebView.goBack();
			return true;
		}

		if (this.mBoolExitApp == undefined || !this.mBoolExitApp)
		{
			console.log("뒤로 버튼 한번 더 누르시면 종료됩니다.");
			//ToastAndroid.show('뒤로 버튼 한번 더 누르시면 종료됩니다.', ToastAndroid.SHORT);
			this.mBoolExitApp = true;
			this.mClsTimeout = setTimeout(() => { this.mBoolExitApp = false; }, 2000);
		}
		else
		{
			console.log(" -Exit App ");
			clearTimeout(this.mClsTimeout);
			BackHandler.exitApp();  // 앱 종료
		}
		return true;
	};
 

	/**
	 * 웹뷰에게 메시지를 전달한다.
	 * @param {*} strMsgId 명령ID
	 * @param {*} objData  명령데이터
	 */
	postMessage = (strMsgId, objData) => {
		//console.log("*postMessage, payload:"+ strPayload);
		if(this.refWebView != null)
		{
			let objPayload = {"msgId" : strMsgId, "msgData" : objData};
			let strPayload = JSON.stringify(objPayload);
			this.refWebView.postMessage(strPayload);
		}
	}
	

	/**
	 * 웹뷰로 부터 메시지를 수신한다.
	 * @param {*} event 이벤트
	 */
	onWebViewMessage = (event) => {
		console.log("==========================================");
		console.log("*Main.onWebViewMessage(), Event:", JSON.stringify(event.nativeEvent));
		if(event.nativeEvent.data != null)
		{
			let objData = JSON.parse(event.nativeEvent.data);
			let strMsgId = objData.msgId;
			console.log(" -MsgId:" + strMsgId);
			
			if(consts.MSG_NEW_SCREEN == strMsgId)
			{
				console.log(" -새로운화면요청");
				this.props.navigation.navigate("NewScreen", objData);
			}
			else if(consts.MSG_GET_SCAN_DATA == strMsgId || consts.MSG_GET_MULTI_SCAN_DATA == strMsgId)
			{
				console.log(" -스캔데이터 리턴");
				if (this.props.route.name !== "QrScan")
				{
					this.props.navigation.navigate("QrScan", objData);
				}
				//this.props.navigation.navigate("QrScan", objData);
			}
			else if(consts.MSG_SET_STATUS_BAR == strMsgId)
			{
				console.log(" -상태바수정");
				this.props.dispatch(setStatusBar(objData.msgData));
			}
			// else if(consts.MSG_SET_LOADING == strMsgId)
			// {
			// 	console.log(" -로딩설정, objData.msgData:"+ objData.msgData);
			// 	this.setState({ isLoading: objData.msgData });
			// }
			else if(consts.MSG_SET_APP_DATA == strMsgId)
			{
				console.log(" -App 정보 설정");
				let objMsgData = objData.msgData;
				let strBaseUrl = objMsgData.baseUrl;
				console.log(" -BaseUrl:" + strBaseUrl);
				this.setState({ sourceUrl : strBaseUrl + this.props.appData.authPage });
				this.props.dispatch(setAppData({baseUrl: strBaseUrl}));
			}
			else if(consts.MSG_GET_DEVICE_INFO == strMsgId)
			{
				console.log("=================================");
				console.log("*디바이스 정보 리턴");
				console.log("=================================");	
				this.getDeviceInfo();
			}
			else if(consts.MSG_REQUEST_LOCATION == strMsgId)
			{
				console.log("=================================");
				console.log("*위치 정보 리턴");
				console.log("=================================");
				let objLocData = {
					result: "fail"
				};

				Geolocation.getCurrentPosition(
					position => {
						objLocData.latitude = position.coords.latitude;
						objLocData.longitude = position.coords.longitude;
						objLocData.result = "success";

						this.postMessage(consts.MSG_REQUEST_LOCATION, JSON.stringify(objLocData));
						console.log("현재 위치:", position.coords);
					},
					error => {
						objLocData.error = error.message;
						this.postMessage(consts.MSG_REQUEST_LOCATION, JSON.stringify(objLocData));
						console.log("위치 가져오기 실패:", error);
					},
					{
						enableHighAccuracy: false,
						timeout: 15000,
						maximumAge: 10000
					}
				);
			}
		}
	}

	async getDeviceInfo()
	{
		let objAppData		= this.props.appData;
		console.log("@@@@@@@@@@@@@@@@@@objAppData:"+ JSON.stringify(objAppData));
		if(objAppData != null)
		{
			let objData = {
				deviceId	: objAppData.deviceId,
				deviceModel	: objAppData.deviceModel,
				appVersion	: objAppData.appVersion,
				osType		: objAppData.osType,
				osVersion	: objAppData.osVersion,
				pushTokenId	: objAppData.pushTokenId
			};
			console.log(JSON.stringify(objData));
			this.postMessage(consts.MSG_GET_DEVICE_INFO, JSON.stringify(objData));
		}
	}

	/**
	 * 에러에 대한 다이얼로그를 보여준다.
	 */
	showErrorDialog = (strTitle, strContent, boolExit) => {
		let arrOption = {
			visible: true,
			animationType: "fade",
			overlayStyle : { padding: 20 }, 
			dialogStyle : { paddingTop:0, paddingLeft:10, paddingRight:10, paddingBottom:16, borderRadius:20, backgroundColor:"#fff"},
			title : strTitle,
			titleStyle : { fontWeight:"bold", fontSize:16, },
			content: (<Text>{strContent}</Text>),
			contentStyle : { fontSize:14, fontWeight :"bold", color:"#000", marginTop:8, marginBottom:20, alignItems: 'center',},
			buttonsStyle : { padding:0},

			buttons: (
				<View style={{flexDirection:"row", height:48}}>
					<TouchableOpacity onPress = {() => { 
						this.props.dispatch(hideDialog()); 
						if(boolExit)
						{
							setTimeout(() => { 
								RNRestart.Restart(); 
							}, 100);
						} 
					}} style={{flex:1, borderRadius:8, backgroundColor:"#f6f6f6", justifyContent:"center", alignItems:"center"  }}>
						<Text style={{ fontSize: 16, fontWeight: "bold", color:"#444"}}>OK</Text>
					</TouchableOpacity>
				</View>
			),
		};
		this.props.dispatch(showDialog(arrOption));	
	}


	/**
	 * 로딩 시작 이벤트
	 */
	onLoadStart = (event) => {
		console.log("*Main.onLoadStart()");
		const strUrl = event.nativeEvent.url;
		console.log("strUrl: "+ strUrl);
		const objRegex = /.*talk.*\.do/i;
		// talk.do는 SPA처럼 구현해 놓은 상태라 로딩창없도록 하드코딩 
		if (objRegex.test(strUrl))
		{
			console.log(" - 채팅은 loading창을 안띄운다.");
			return;
		}
		this.showLoading();
	}


	/**
	 * 로딩 완료 이벤트
	 */
	onLoadEnd = async() => {
		//console.log("*Main.onLoadEnd()");
		this.hideLoading();
		//await CookieManager.flush()
		await NitroCookies.flush();
	}

	/**
	 * 모든 웹뷰의 요청에 대하여 커스텀으로 처리할수 있는 메소드
	 * @param {*} event 이벤트
	 * @returns 
	 */
	onShouldStartLoadWithRequest = (event) =>
	{
		console.log("*Main.onShouldStartLoadWithRequest :", event);
		let strEventUrl = event.url;
		if (strEventUrl.startsWith('http://') || strEventUrl.startsWith('https://') || strEventUrl.startsWith('about:blank'))
		{
			return true;
		}

		// 안드로이드 Deep Link 처리, IOS는 info.plist에 명기, 그외 tel:등의 링크처리 
		if (Platform.OS === 'android')
		{
			console.log(" -안드로이드");
			SendIntentAndroid.openAppWithUri(strEventUrl).then(isOpened => {
				if (isOpened == false)
				{
					alert("앱 실행에 실패했습니다.\n앱이 설치되어 있지 않은 경우, 앱을 설치하신 후 이용 하여 주세요.");
				}
			}).catch(err => {
				console.log("---------------------------------");
				console.log(err);
				console.log("---------------------------------");
			});
			return false;
		}
		else
		{
			Linking.openURL(strEventUrl).catch(err => {
				alert("앱 실행에 실패했습니다.\n앱이 설치되어 있지 않은 경우, 앱을 설치하신 후 이용 하여 주세요.");
			});
			return false;
		}		

		return true;		
	}	

	/**
	 * 웹뷰 에러 이벤트
	 * @param {*} syntheticEvent  이벤트
	 */
	onError = (syntheticEvent) => {
		const { nativeEvent } = syntheticEvent;
		console.log("===========================");
		console.log("*Main.onError :", nativeEvent);
		// console.log("*Main.onError,code :", nativeEvent.code);
		// console.log("*Main.onError,description :", nativeEvent.description);
		console.log("===========================");	
		
		this.setState({ isConnected:  false });	// 활용할수 없는 페이지입니다. 에러대신 빈화면을 보여주기 위해
		if(nativeEvent.code == "-1001")
		{
			// The Request Timed Out.
			//this.showErrorDialog("서버에 접속할수 없습니다.", "서버 점검 또는 업데이트로 인하여 서버에 접속할수 없습니다.\n앱을 종료한후 다시 시도하여 주세요.", true);
			this.showErrorDialog("Error", "The Request Timed Out. ErrorCode:-1001", true);
		
		
		}
		else if(nativeEvent.code == "-2")
		{
			// ERR_NAME_NOT_RESOLVED
			//this.showErrorDialog("DNS 또는 WIFI 문제 발생", "DNS에 문제가 있거나, WIFI에 문제가 있을수 있습니다. 확인하시고 접속을 다시 시도하여 주세요.", true);	
			this.showErrorDialog("Error", "DNS Name Not Resolved. ErrorCode:-2", true);
		}
		else
		{	
			//this.showErrorDialog("서버 응답을 받지 못했습니다.", "네트워크 상태를 확인해주세요. 지속적으로 발생하는 경우 고객센터로 문의해 주세요.", true);
			this.showErrorDialog("Error", "Network Error. ErrorCode:"+ nativeEvent.code, true);
		}
	}

	hideLoading=()=> {
		this.setState({ isLoading: true });
	}

	showLoading=()=> {
		this.setState({ isLoading: false });
	}

	onNaviStateChange = (event) => {
		console.log("*Main.onNaviStateChange(), canGoBack:"+ event.canGoBack );
		this.setState({ canGoBack: event.canGoBack, currentUrl: event.url, });
	}

	/**
	 * 화면 렌더
	 */
	render()
	{
		const { sourceUrl, isConnected, isLoading, currentUrl } = 	this.state;

		let strAppColor = currentUrl.indexOf("login") != -1 ? colors.WHITE : colors.DEFAULT;
		let strContentAreaColor = colors.BACKGROUND;
		console.log("*Main.render(), sourceUrl:"+ sourceUrl +",AppColor:"+ strAppColor +", isLoading:"+ isLoading);
		return (
			<Fragment> 
				<AppStatusBar />
				<View style={{flex:1, backgroundColor: strAppColor}}>
					<SafeAreaView style={styles.contentArea}>
				{ isConnected ? (
					<View style={{ flex: 1 }}>
						<WebView style={{ flex:1, backgroundColor: strContentAreaColor }}
							source={{uri: sourceUrl}}
							originWhitelist={['*']} 
							ref={webView => this.refWebView = webView }
							javaScriptCanOpenWindowsAutomatically={true}
							applicationNameForUserAgent={this.mStrUserAgent}
							javaScriptEnabled={true}
							setSupportMultipleWindows={true}
							textZoom={100}
							pullToRefreshEnabled={false}
							allowsBackForwardNavigationGestures={false}

							cacheEnabled={true}
							domStorageEnabled={true}

							allowFileAccess={true}
							allowUniversalAccessFromFileURLs={true}
							mixedContentMode="always"
							//  Android 파일 업로드
							onFileDownload={(e) => {
								console.log("download", e.nativeEvent);
							}}

							// 채팅입력시 IOS에서 방향키 + Done 버튼 숨기기 위해 
							hideKeyboardAccessoryView ={true}
							onMessage={ this.onWebViewMessage }
							onLoadStart={ this.onLoadStart }
							onLoadEnd={ this.onLoadEnd }
							onError={ this.onError }
							onNavigationStateChange={this.onNaviStateChange} 
							onShouldStartLoadWithRequest={ this.onShouldStartLoadWithRequest } />
						{isLoading == false && (
							<View style={styles.loading}>
								<ActivityIndicator size="large" color={colors.DEFAULT}/>
							</View>
						)}	

					</View>
				): (
					<View style={{flex:1, backgroundColor: colors.PRIMARY  }}></View>
				)}
							
						<View style={[styles.homeIndicator, { }]} />	
					</SafeAreaView>
				</View>
	
			</Fragment>
		);
	}
 }
const styles = StyleSheet.create({
	contentArea		: { flex: 1, padding:0 },
	loading			: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
	homeIndicator	: { position: 'absolute', backgroundColor: '#f9f9f9', left: 0, right: 0, bottom: 0, height: 100, zIndex: -1000, }
});
 
const mapStateToProps = (state, ownProps) => {
	return {
		appData			: state.appData,
		pushData		: state.pushData
	}
}

export default connect(mapStateToProps)(React.memo(Main));

  
