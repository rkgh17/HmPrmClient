/**
 * @file	Permission.js
 * @date	2025.04.11
 * @author	yomile
 * @brief	초기 피미션 체크 화면 파일
 */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from "react-redux";
import {colors, consts } from "~/common/libs/base";
import AppStatusBar from "~/components/AppStatusBar";
import {WebView} from "react-native-webview";
import { showDialog, hideDialog } from "~/redux/actions/dialogAction";
import mosaic from "~/common/libs/mosaic/mosaic";
import { setCheckPermission } from "~/redux/actions/appDataAction";

 
 /**
   *  초기 피미션 체크 화면 클래스
   *  
   * @author	yomile
   * @version	1.0
   * @see <pre>
   *  == 개정이력(Modification Information) ==
   *   
   *   수정일      수정자           수정내용
   *  -------    --------    ---------------------------
   *   2025.04.11  yomile          최초 생성
   * 
   * </pre>
   */
class Permission extends PureComponent
{
	/**
	 * 생성자
	 * @param {*} props  프로퍼티
	 */	
	constructor(props)
	{
		super(props);
		 
		const { baseUrl, permissionPage } = this.props.appData;

		this.state = {
			sourceUrl			: baseUrl + permissionPage,
			isConnected			: true
		};
	}
  

	/**
	 * 웹뷰로 부터 메시지를 수신한다.
	 * @param {*} event 이벤트
	 */
	onWebViewMessage = (event) => {
		console.log("*Permission.onWebViewMessage(), Event:", JSON.stringify(event.nativeEvent));
		if(event.nativeEvent.data != null)
		{
			let objData = JSON.parse(event.nativeEvent.data);
			let strMsgId = objData.msgId;
			console.log("*Permission.onWebViewMessage(), MsgId:" + strMsgId);
			if(consts.MSG_REQUEST_PERMISSION == strMsgId)
			{
				console.log("=================================");
				console.log("*MSG_REQUEST_PERMISSION");
				console.log("=================================");	

				this.requestBasePermission().then(async () => {
					this.props.dispatch(setCheckPermission(true));	
				});
			}
		}
	}	

	requestBasePermission = async() => {
		console.log("*Permission.requestBasePermission()");
		const { androidPermissions, androidExtendPermissions, iosPermissions, iosExtendPermissions } = this.props.appData;
		var arrPermission = (Platform.OS === "ios") ? iosPermissions : androidPermissions;
		console.log("arrPermission:", arrPermission);
		let clsPermissionMgr = new mosaic.permission.PermissionMgr(arrPermission);			
		let boolGranted = await clsPermissionMgr.checkPermission();
		console.log(" -기본퍼미션Grant여부:", boolGranted);
		if(boolGranted == true)
		{
			await this.requestExtendPermission(androidExtendPermissions, iosExtendPermissions);
		}
		else
		{
			console.log(" -기본퍼미션요구처리");
			let boolReGranted =  await clsPermissionMgr.checkRequestMultiple();
			console.log(" -기본퍼미션요구후Grant여부:", boolReGranted);
			if(boolReGranted == true)
			{
				await this.requestExtendPermission(androidExtendPermissions, iosExtendPermissions);
			}
			else
			{
				console.log(" -기본퍼미션을 거부했더라도 앱을 초기화 한다. 기존앱이 그렇게 되어있음.");
				await this.initializeApp();
			}
		}
	}


	/**
	 * 추가로 허용해야 하는 퍼미션으로 ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION 이 Grant되었다면, ACCESS_BACKGROUND_LOCATION 퍼미션을 추가로 허용해야한다. 
	 */
	requestExtendPermission = async(arrAndroidExtendPermissions, arrIosExtendPermissions) => {
		console.log("-------------------------------------");
		console.log("*Permission.requestExtendPermission()")
		var arrPermission = (Platform.OS === 'ios') ? arrIosExtendPermissions : arrAndroidExtendPermissions;
		if(arrPermission == null || arrPermission.length == 0)
		{
			// 캐디의 경우는 추가퍼미션이 없음.
			await this.initializeApp();
		}
		else
		{
			let clsPermissionMgr = new mosaic.permission.PermissionMgr(arrPermission);			
			let boolGranted = await clsPermissionMgr.checkPermission();
			console.log(" -추가퍼미션이 있는지 체크,허락상태:", boolGranted);

			if(boolGranted == true)
			{
				console.log(" -추가퍼미션이 있으므로 앱실행");
				await this.initializeApp();
			}
			else
			{
				console.log(" -추가퍼미션이 없으므로 퍼미션요청한후 앱을 초기화");
				await clsPermissionMgr.checkRequestMultiple();
				await this.initializeApp();
			}
		}
	}

	/**
	 * 앱 초기화 
	 */
	async initializeApp()
	{
		console.log("-------------------------------------");
		console.log("*Permission.initializeApp()");
		console.log("-------------------------------------");
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
	 * 웹뷰 에러 이벤트
	 * @param {*} syntheticEvent  이벤트
	 */
	onError = (syntheticEvent) => {
		const { nativeEvent } = syntheticEvent;
		console.log("===========================");
		console.log("*Permission.onError :", nativeEvent);
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
		console.log("*Permission.Render(), sourceUrl:"+ sourceUrl);
		return (
			<Fragment> 
				<AppStatusBar />
				<View style={{flex:1, backgroundColor: colors.WHITE}}>
					
					<SafeAreaView style={styles.contentArea}>
						
					{ isConnected ? (
						<View style={{ flex: 1 }}>
							<WebView style={{ flex:1, backgroundColor: colors.BACKGROUND }}
								source={{uri: sourceUrl}}
								originWhitelist={['*']} 
								ref={webView => this.refWebView = webView }
								javaScriptEnabled={true}
								textZoom={100}
								cacheEnabled={true}
								onMessage={ this.onWebViewMessage }
								onError={ this.onError }
								startInLoadingState={true}
								renderLoading={() => ( <View style={styles.loading}><ActivityIndicator size="large" color={colors.DEFAULT}/></View> )}
								/>
						</View>
					): (
						<View style={{flex:1, backgroundColor: "yellow"  }}></View>
					)}
						<View style={[styles.homeIndicator, { backgroundColor: colors.WHITE}]} />	
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
export default connect(mapStateToProps)(React.memo(Permission));
 