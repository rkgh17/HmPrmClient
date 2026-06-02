/**
 * @file	NewScreen.js
 * @date	2025.04.07
 * @author	yomile
 * @brief	새로운화면 파일
 */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet, BackHandler, ActivityIndicator, TouchableOpacity, Platform, Linking, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from "react-redux";
import { colors, consts } from "~/common/libs/base";
import AppStatusBar from "~/components/AppStatusBar";
import { StackActions } from '@react-navigation/native';
import {WebView} from "react-native-webview";
import NitroCookies from 'react-native-nitro-cookies';
import SendIntentAndroid from "react-native-send-intent";
import { showDialog, hideDialog } from "~/redux/actions/dialogAction";
 
/**
 *  새로운 화면 클래스
 *  
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
class NewScreen extends PureComponent
{
	getSourceUrlFromParams = (params) => {
		if (params == null) return null;
		if (params.sourceUrl != null) return params.sourceUrl;
		if (params.msgData != null && params.msgData.sourceUrl != null) return params.msgData.sourceUrl;
		return null;
	}

	/**
	 * 생성자
	 * @param {*} props  프로퍼티
	 */	
	constructor(props)
	{
		super(props);
		this.mBoolExitApp		= false;
		this.mClsBackHandler	= null;
		const strSourceUrl = this.getSourceUrlFromParams(this.props.route.params);

		this.state = {
			sourceUrl			: strSourceUrl,
	
			canGoBack			: false,
			isConnected			: true,
		};
	}
  
 
	/**
	 * componentDidMount 이벤트
	 */
	async componentDidMount()
	{
	
		if(this.props.route.params != null)
		{
			const strSourceUrl = this.getSourceUrlFromParams(this.props.route.params);
			this.setState({sourceUrl : strSourceUrl });
		}		
		// 백버튼 핸들러 등록
		this.mClsBackHandler = BackHandler.addEventListener("hardwareBackPress", this.onBackPressed);
	}

	componentDidUpdate(prevProps)
	{
		if (prevProps.route?.params !== this.props.route?.params)
		{
			const params = this.props.route.params;
			const strMsgId = params?.msgId;

			if(strMsgId === consts.MSG_GET_SCAN_DATA || strMsgId === consts.MSG_GET_MULTI_SCAN_DATA)
			{
				if(this.refWebView != null)
				{
					this.refWebView.postMessage(JSON.stringify(params));
				}
				return;
			}

			const strSourceUrl = this.getSourceUrlFromParams(this.props.route.params);
			if (strSourceUrl != null && strSourceUrl !== this.state.sourceUrl)
			{
				this.setState({ sourceUrl: strSourceUrl });
			}
		}
	}
	
	/**
	 * componentWillUnmount 이벤트
	 */
	componentWillUnmount()
	{
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
		//console.log("*NewScreen.onBackPressed(), this.state.canGoBack:"+ this.state.canGoBack);
		if (this.state.canGoBack)
		{
			if(this.refWebView != null) this.refWebView.goBack();
			return true;
		}
		else
		{
			const popAction = StackActions.pop(1);
			this.props.navigation.dispatch(popAction);
		}
		return true;
	};

	onNavigationStateChange = (event) => {
		//console.log("*NewScreen.onNavigationStateChange(), event:"+ JSON.stringify(event));
		this.setState({ canGoBack: event.canGoBack, sourceUrl : event.url });		
	}



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
		//console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		console.log("*NewScreen.onWebViewMessage(), Event:", JSON.stringify(event.nativeEvent));
		if(event.nativeEvent.data != null)
		{
			let objData = JSON.parse(event.nativeEvent.data);
			let strMsgId = objData.msgId;
			console.log("*NewScreen.onWebViewMessage(), MsgId:" + strMsgId);
			if(consts.MSG_REQUEST_GO_MAIN == strMsgId)
			{
				console.log("=================================");
				console.log("*MSG_REQUEST_GO_MAIN");
				console.log("=================================");		
				this.props.navigation.navigate("Main", objData);
			}
			
			if (strMsgId === consts.MSG_CLOSE_NEW_SCREEN) {
				console.log("=================================");
				console.log("*MSG_CLOSE_NEW_SCREEN");
				console.log("=================================");		
				this.props.navigation.goBack();
				return;
			}

			if(consts.MSG_GET_SCAN_DATA == strMsgId || consts.MSG_GET_MULTI_SCAN_DATA == strMsgId) 
			{
				console.log(" -스캔데이터 리턴");
				if (this.props.route.name !== "QrScan")
				{
					this.props.navigation.navigate("QrScan", {...objData, sourceScreen: "NewScreen"});
				}
			}
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
	 * 로딩 완료 이벤트
	 */
	onLoadEnd = async () => {
		//console.log("*NewScreen.onLoadEnd()");
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
		//console.log("*NewScreen.onShouldStartLoadWithRequest :", event);
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
		console.log("*NewScreen.onError :", nativeEvent);
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



	/**
	 * 화면 렌더
	 */
	render()
	{
		const { sourceUrl, isConnected } = this.state;

		return (
			<Fragment> 
				<AppStatusBar />
				<View style={{flex:1, backgroundColor: colors.DEFAULT}}>
					<SafeAreaView style={styles.contentArea}>
						
					{ isConnected ? (
						<View style={{ flex: 1 }}>
							<WebView style={{ flex:1, backgroundColor: colors.BACKGROUND }}
								source={{uri: sourceUrl}}
								originWhitelist={['*']} 
								ref={webView => this.refWebView = webView }
								javaScriptCanOpenWindowsAutomatically={true}
								javaScriptEnabled={true}
								setSupportMultipleWindows={true}
								textZoom={100}
								pullToRefreshEnabled={false}
								allowsBackForwardNavigationGestures={false}

								collapsable={false}
								cacheEnabled={false}
								cacheMode={'LOAD_NO_CACHE'}
								domStorageEnabled={true}

								onMessage={ this.onWebViewMessage }

								onLoadEnd={ this.onLoadEnd }
								onError={ this.onError }
								onShouldStartLoadWithRequest={ this.onShouldStartLoadWithRequest }
								startInLoadingState={true}
								renderLoading={() => ( <View style={styles.loading}><ActivityIndicator size="large" color={colors.DEFAULT}/></View> )}

								/>
						</View>
					): (
						<View style={{flex:1, backgroundColor: colors.PRIMARY  }}>
						</View>
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
		appData			: state.appData
	}
}
export default connect(mapStateToProps)(React.memo(NewScreen));

 