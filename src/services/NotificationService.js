/**
 * @file	NotificationService.js
 * @date	2026.01.09
 * @author	yomile
 * @brief	메시지 통지 서비스 파일
 */
import notifee, {AndroidImportance, AndroidVisibility, EventType} from '@notifee/react-native';
import { Platform } from 'react-native';

/**
  * 메시지 통지 서비스 클래스   
  * @author	yomile
  * @version	1.0
  * @see <pre>
  *  == 개정이력(Modification Information) ==
  *   
  *   수정일      수정자           수정내용
  *  -------    --------    ---------------------------
  * 2026.01.09  yomile          최초 생성
  * 
  * </pre>
  */


const CHANNEL_ID_SOUND_ON_VIBRATE_ON	= "hmprm.client.channel.soundon_vibrateon";
const CHANNEL_ID_SOUND_ON_VIBRATE_OFF	= "hmprm.client.channel.soundon_vibrateoff";
const CHANNEL_ID_SOUND_OFF_VIBRATE_ON	= "hmprm.client.channel.soundoff_vibrateon";
const CHANNEL_ID_SOUND_OFF_VIBRATE_OFF	= "hmprm.client.channel.soundoff_vibrateoff";


class NotificationService
{
	
	/**
	 * 생성자
	 */	
	constructor()
	{
		this.lastId = 0;
		this.mClsUnsubscribeForegroundEvent = null;

		console.log("*NotificationService.생성자");
		// // 권한 요청 (iOS / Android 13+)
		// notifee.requestPermission({alert: true, badge: true, sound: true });

		if (Platform.OS === "android")
		{
			this.createDefaultChannels();
		}
		notifee.setBadgeCount(0);	
	}

	requestPermission = async () => {
		console.log("*NotificationService.requestPermission()");
		return await notifee.requestPermission({ alert: true, badge: true, sound: true });
	}

	/**
	 * 앱의 아이콘에 뱃지 갯수를 설정한다.
	 * @param {*} intBadgeNumber 뱃시갯수
	 */
	setApplicationIconBadgeNumber = async(intBadgeNumber) =>
	{
		await notifee.setBadgeCount(intBadgeNumber);
	}
	
	/**
	 * 노티피케이션 초기 설정
	 * @param {*} onOpenNotification  오픈이벤트
	 */	
	configure = async(onOpenNotification) => 
	{
		console.log("*NotificationService.configure");
		
		// 알림 클릭 (포그라운드)
		this.mClsUnsubscribeForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
			
			console.log("*notifee.onForegroundEvent");
			console.log(" -Type:"+ type);

			if (type === EventType.PRESS)
			{ 
				console.log(" 클릭한경우:"+ JSON.stringify(detail));
				onOpenNotification?.(detail.notification?.data);
			}
			else if( type == EventType.DELIVERED)
			{
				console.log("알림 표시됨");
			}
			else if( type == EventType.DISMISSED)
			{
				console.log("알림 사라짐 (자동 또는 사용자)");
			}
		});
	}

	/** 예전 react-native-push-notification은 unregister가 있었으나 notifee는 없음 */
	unregister = async () => {
		console.log("*NotificationService.unregister");

		if (this.mClsUnsubscribeForegroundEvent)
		{
			this.mClsUnsubscribeForegroundEvent();
			this.mClsUnsubscribeForegroundEvent = null;
		}
	};

	/**
	 * 노티피케이션을 출력한다.
	 * @param {*} strId 아이디
	 * @param {*} strTitle  제목
	 * @param {*} strMessage  메시지
	 * @param {*} strImageUrl 이미지경로
	 * @param {*} data 추가데이터
	 * @param {*} options 옵션
	 */	
	showNotification = async(strId, strTitle, strMessage, data = {}, options = {}) => 
	{
		strId = ++this.lastId;
		let boolPlaySound	= options.playSound || false;
		let strSoundName	= options.soundName || "default";
		let boolVibrate		= options.vibrate || false;

		console.log("*NotificationService.showNotification");
		console.log(" -id:"+ strId);
		console.log(" -Title:"+ strTitle);
		console.log(" -message:"+ strMessage);
		console.log(" -data:"+ JSON.stringify(data));
		console.log(" -PlaySound:"+ boolPlaySound);
		console.log(" -SoundName:"+ strSoundName);
		console.log(" -Vibrate:"+ boolVibrate);
		

		let strChannelId = CHANNEL_ID_SOUND_ON_VIBRATE_ON;

		if (boolPlaySound)
		{
			strChannelId = boolVibrate ? CHANNEL_ID_SOUND_ON_VIBRATE_ON : CHANNEL_ID_SOUND_ON_VIBRATE_OFF;
		}
		else
		{
			strChannelId = boolVibrate ? CHANNEL_ID_SOUND_OFF_VIBRATE_ON : CHANNEL_ID_SOUND_OFF_VIBRATE_OFF;
		}

		console.log(" -ChannelId:"+ strChannelId);
		console.log(" -options:", options);

		let objNotification = {
			id		: String(strId),
			title	: strTitle,
			body	: strMessage,
			data,
			android: 
			{
				channelId			: strChannelId,
				importance			: AndroidImportance.HIGH,
				autoCancel			: true,
				pressAction			: { id: 'default' },
				largeIcon			: options.largeIcon || "ic_launcher",
				smallIcon			: options.smallIcon || "ic_launcher",
				largeIconUrl		: options.largeIcon || "ic_launcher",
				subText				: strTitle || "",
				bigText				: strMessage || "",
				color				: '#ff0000',
				vibrationPattern	: boolVibrate ? [300] : undefined,
				sound				: boolPlaySound ? strSoundName : undefined,
			},
			ios:
			{
				//sound				: boolPlaySound ? strSoundName : undefined,
				sound : "default",
				// iOS foreground에서도 알림 표시
				foregroundPresentationOptions: { alert: true, sound: true, badge: true },	
			},
		};

		console.log(" -objNotification:" + JSON.stringify(objNotification));
		await notifee.displayNotification(objNotification);
	}



	cancelAllLocalNotifications = async () => {
		await notifee.cancelAllNotifications();
	};
	

	createDefaultChannels = async () => {
		console.log("*NotificationService.createDefaultChannels()")
		const objBase = {
			name		: "모자이크 푸시알림 채널",
			importance	: AndroidImportance.HIGH,
			visibility	: AndroidVisibility.PUBLIC,
		};
		await notifee.createChannel({ id: CHANNEL_ID_SOUND_ON_VIBRATE_ON,  ...objBase, sound: 'default', vibration: true });
		await notifee.createChannel({ id: CHANNEL_ID_SOUND_ON_VIBRATE_OFF, ...objBase, sound: 'default', vibration: false });
		await notifee.createChannel({ id: CHANNEL_ID_SOUND_OFF_VIBRATE_ON, ...objBase, sound: undefined, vibration: true });
		await notifee.createChannel({ id: CHANNEL_ID_SOUND_OFF_VIBRATE_OFF,...objBase, sound: undefined, vibration: false });
	};
}
export const notificationService = new NotificationService()
