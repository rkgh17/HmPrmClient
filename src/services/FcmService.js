/**
 * @file	FcmService.js
 * @date	2025.02.11
 * @author	yomile
 * @brief	파이어베이스푸시 서비스 파일
 */
import messaging from "@react-native-firebase/messaging";
import {Platform} from "react-native";


/**
 * 파이어베이스푸시 서비스 클래스
 * @author	yomile
 * @version	1.0
 * @see <pre>
 *  == 개정이력(Modification Information) ==
 *   
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2025.02.11  yomile          최초 생성
 * 
 * </pre>
 */
class FcmService
{
	/**
	 * 서비스 등록
	 * @param {*} onRegister  등록이벤트
	 * @param {*} onNotification  노티이벤트
	 * @param {*} onOpenNotification  열렸을때이벤트
	 */
	register = async(onRegister, onNotification, onOpenNotification) => 
	{
		//console.log("====================================");
		console.log("*FcmService.register()");
		//console.log("====================================");	

		if (Platform.OS === "ios") await this.registerDevice();	
		await this.checkPermission(onRegister);
		this.createNotificationListeners(onRegister, onNotification, onOpenNotification);
	}

	/**
	 * 원격메시지 수신을 위한 다바이스 등록(IOS)
	 */
	 registerDevice = async() => 
	{
		//console.log("====================================");
		console.log("*FcmService.registerDevice()");
		//console.log("====================================");	
		await messaging().registerDeviceForRemoteMessages();
		await messaging().setAutoInitEnabled(true)
	
	}

	/**
	 * 퍼미션 체크
	 * @param {*} onRegister  등록이벤트
	 */
	checkPermission = (onRegister) => 
	{
		
		//console.log("====================================");
		console.log("*FcmService.checkPermission()");
		//console.log("====================================");
		messaging().hasPermission().then(enabled => {
			console.log(" -Fcm HasPermission Enabled:"+ enabled);

			// if (enabled)
			// {
			// 	this.getToken(onRegister);
			// }
			// else
			// {
			// 	this.requestPermission(onRegister)
			// }

			this.getToken(onRegister);
		}).catch(error => {
			console.log("[FcmService] Permission rejected ", error);
		})
	}

	/**
	 * 토큰을 리턴한다.
	 * @param {*} onRegister  등록이벤트
	 */
	getToken = async (onRegister) => 
	{
		//console.log("====================================");
		console.log("*FcmService.getToken()");
		//console.log("====================================");	
		/*		
		messaging().registerDeviceForRemoteMessages().then(() => {
		  messaging().getToken().then((fcmToken) => {
			onsole.log("@@@@@@@@@@@@@@fcmToken:"+ fcmToken);

				onRegister(fcmToken);
			});
		})
		.catch((error) => {
		  console.log("FETCH MESSAGING TOKEN ERROR:", error);
		});
		*/

		/*
		messaging().getToken().then(fcmToken => {
			if (fcmToken)
			{
				console.log(" -fcmToken:"+ fcmToken);	
				onRegister(fcmToken);
			}
			else
			{
				console.log("[FcmService] User does not have a device token");
			}
		}).catch(error => {
			console.log("[FcmService] getToken rejected ", error)
		});
		*/

		try 
		{
			let apnsToken = null;

			if(Platform.OS === 'ios')
			{
				apnsToken = await messaging().getAPNSToken();

				if(!apnsToken)
				{
					console.log("[FcmService] No apns token available");
					return;
				}

				console.log("[FcmService] APNs token : "+apnsToken);

				await messaging().setAPNSToken(apnsToken);
				console.log("[FcmService] APNs token has been set for Firebase");
			}

			const fcmToken = await messaging().getToken();
			//console.log("[FcmService] FcmToken : "+fcmToken);
			onRegister(fcmToken);
		}
		catch (error) 
		{
			console.log("[FcmService] getToken rejected ", error);
		}
	
	}

	/**
	 * 퍼미션 요청
	 * @param {*} onRegister 등록이벤트
	 */
	requestPermission = (onRegister) => 
	{
		//console.log("====================================");
		console.log("*FcmService.requestPermission()");
		//console.log("====================================");	
		messaging().requestPermission().then(() => {
			this.getToken(onRegister)
		}).catch(error => {
			console.log("[FcmService] 퍼미션 요청 거절됨:", error)
		});
	}

	/**
	 * 토큰을 삭제한다.
	 */
	deleteToken = () => 
	{
		console.log("[FcmService] deleteToken ")
		messaging().deleteToken().catch(error => {
			console.log("[FcmService] Delete token error ", error)
		});
	}

	/**
	 * 노티피케이션 리스너를 생성
	 * @param {*} onRegister 등록이벤트
	 * @param {*} onNotification  노티이벤트
	 * @param {*} onOpenNotification 오픈이벤트
	 */
	createNotificationListeners = (onRegister, onNotification, onOpenNotification) => {
		console.log("*createNotificationListeners()");
		
		// 앱이 런닝중이지만, 백그라운드인 경우
		messaging().onNotificationOpenedApp(remoteMessage => {
			//console.log("[FcmService] onNotificationOpenedApp Notification caused app to open from background state:", remoteMessage);
			if (remoteMessage)
			{
				console.log(" 메시지 수신");
				console.log(" -remoteMessage :" + JSON.stringify(remoteMessage));

				const notification = remoteMessage.notification;
				onOpenNotification(notification);
			}
		});
		
		// 앱이 실행중이 아닐때
		messaging().getInitialNotification().then(remoteMessage => {
			//console.log("[FcmService] getInitialNotification Notification caused app to open from quit state:",remoteMessage)
			if (remoteMessage)
			{
				const notification = remoteMessage.notification
				onOpenNotification(notification)
			}
		});
		
		// 포그라운드 상태 메시지
		this.messageListener = messaging().onMessage(async payload => {
			// 2025.02.11 그린재킷에서는 서버로 페이로드를 직접 전송하는 방식이므로 그냥 리턴한다.

			console.log("*FcmService, 포그라운드 수신메시지 :", payload);

			onNotification(payload);

			/* TODO 삭제 yomile
			if (payload)
			{
				let arrNotification = {};
				if(Object.keys(payload.data).length == 0)
				{
					arrNotification = { tit : payload.notification.title, msg : payload.notification.body };	
				}
				else
				{
					arrNotification = payload.data;	
				}
				onNotification(arrNotification);
			}*/
		});

		// 새로운 토큰이 생성될때 트리거됨
		messaging().onTokenRefresh(fcmToken => {
			//console.log("[FcmService] New token refresh: ", fcmToken);
			onRegister(fcmToken);
		});
	}

	/**
	 * 서비스리스너를 제거한다.
	 */
	unRegister = () => {
		//this.messageListener()
		this.messageListener = null;
	}
}
export const fcmService = new FcmService()
