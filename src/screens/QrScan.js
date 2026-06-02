import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Vibration, BackHandler, Dimensions, FlatList, Text, TouchableOpacity, Image } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { useFocusEffect } from '@react-navigation/native';
import { colors, consts} from "~/common/libs/base";
import { list } from '@react-native-firebase/app/dist/module/internal/web/firebaseStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HashMap from "~/common/libs/mosaic/mosaic.hashmap.js"

const QrScan = (props) => {
	const { width } = Dimensions.get('window');
	const insets = useSafeAreaInsets();
	const strMsgId = props.route.params.msgId;
	const mHmBarcode = useRef(new HashMap());
	const scanCheckRef = useRef({ value: '', count: 0, });

	const [scan, setScan] = useState(false);
	const [scanData, setScanData] = useState([]);
	
	useEffect(() => {}, []);

	useFocusEffect(
		useCallback(() => {
			const onBackPress = () => {
				props.navigation.goBack();
				return true;
			};
			const clsBackEvent = BackHandler.addEventListener('hardwareBackPress', onBackPress);
			return () => {
				clsBackEvent.remove();
			};
		}, [])
	);

	const onReadQrCode = (event) =>
	{
		if(scan == true) return;

		var strData = event.nativeEvent.codeStringValue;
		console.log("Barcode Data : ", strData);

		if(scanCheckRef.current.value == strData)
		{
			scanCheckRef.current.count += 1;
		}
		else
		{
			scanCheckRef.current.value = strData;
			scanCheckRef.current.count = 1;
		}

		// 4번 연속 같은 바코드가 아니면 추가하지 않음
  	if(scanCheckRef.current.count < 4) return;

		if(mHmBarcode.current.containsKey(strData) == false)
		{
			Vibration.vibrate(100);

			mHmBarcode.current.put(strData, strData);
			setScanData(prevData => [ { id: Date.now().toString(), value: strData, scannedAt: Date.now() }, ...prevData]);
			scanCheckRef.current = { value: '', count: 0 };

			if(strMsgId == consts.MSG_GET_SCAN_DATA)
			{
				confirmScan();
			}
		}
	};

	const confirmScan = () =>
	{
		let arrData = {...props.route.params};
		arrData.data = mHmBarcode.current.values();
		const strSourceScreen = props.route.params.sourceScreen || "Main";
		props.navigation.popTo(strSourceScreen, arrData);

		setScan(true);
	}

	const clearAll = () =>
	{
		mHmBarcode.current.clear();
		setScanData([]);
	};

	const removeItem = (id) =>
	{
		const itemToRemove = scanData.find(item => item.id == id);
		if(itemToRemove)
		{
			mHmBarcode.current.remove(itemToRemove.value);
			setScanData(prevData => prevData.filter(item => item.id != id));
		}
	}

	const formatTime = (timestamp) =>
	{
    const clsDate = new Date(timestamp);
    const strHour = String(clsDate.getHours()).padStart(2, '0');
    const strMinute = String(clsDate.getMinutes()).padStart(2, '0');
    const strSecond = String(clsDate.getSeconds()).padStart(2, '0');

    return `${strHour}:${strMinute}:${strSecond}`;
  };
	
	return (
		<View style={styles.container}>
			
			<Camera	style={[ styles.camera, { marginTop: strMsgId === consts.MSG_GET_MULTI_SCAN_DATA ? -300 : 0 } ]}
				cameraType={CameraType.Back}
				scanBarcode={true}
				showFrame={true}
				laserColor="#ff0000"
				frameColor="#1479ff"
				torchMode="off"
				cameraRatioOverlay={undefined} 
				captureButtonImage={undefined} 
				captureButtonImageStyle={{}} 
				cameraFlipImage={undefined} 
				cameraFlipImageStyle={{}} 
				hideControls={undefined} 
				torchOnImage={undefined} 
				torchOffImage={undefined} 
				torchImageStyle={{}} 
				onReadCode={onReadQrCode}
				
				barcodeFrameSize = {{ width: width, height: 170 }}	// 바코드 인식 영역 크기(width, height)
				scanThrottleDelay={100}	// 바코드 인식 후 다음 인식까지 대기 시간(ms)
				>
			</Camera>

			{strMsgId === consts.MSG_GET_MULTI_SCAN_DATA && (
				<View style={[ styles.bottomSheet, { paddingBottom: insets.bottom } ]}>
					<View style={styles.header}>
						<Text style={styles.title}>스캔 내역 {scanData.length}개</Text>
						<TouchableOpacity style={[ styles.clearButton ]}
															onPress={clearAll}
															disabled={scanData.length === 0}>
							<View style={styles.clearButtonInner}>
								<Image source={require('~/assets/images/delete.png')}
												style={styles.clearDeleteImage} />
								<Text style={[ styles.clearButtonText ]}>
									전체 초기화
								</Text>
							</View>
						</TouchableOpacity>
					</View>
					<FlatList data={scanData}
										style={styles.list}
										contentContainerStyle={styles.listContent}
										showsVerticalScrollIndicator={true}
										removeClippedSubviews={false}
										ListEmptyComponent={
											<View style={styles.emptyBox}>
												<Text style={styles.emptyText}>스캔한 바코드가 없습니다.</Text>
											</View>
										}
										renderItem={({ item, index }) => (
											<View style={styles.scanItem}>
												<View style={styles.indexBadge}>
													<Text style={styles.indexText}>{scanData.length - index}</Text>
												</View>
												<View style={styles.itemContent}>
													<Text style={styles.barcodeText} numberOfLines={1}>
														{item.value}
													</Text>
													<Text style={styles.timeText}>{formatTime(item.scannedAt)}</Text>
												</View>
												<View style={styles.divider} />
												<TouchableOpacity onPress={() => removeItem(item.id)}>
													<View style={styles.clearButtonInner}>
														<Image source={require('~/assets/images/delete.png')}
																		style={styles.deleteImage} />
													</View>
												</TouchableOpacity>
											</View>
										)} />
					<TouchableOpacity style={styles.confirmButton}
														onPress={confirmScan} >
						<Text style={styles.confirmButtonText}>
							확인 {scanData.length > 0 ? `(${scanData.length})` : ''}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	)
};
export default QrScan;

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
	container	: { flex:1 },
	camera		: { flex:1, justifyContent:'center', alignItems:'center' },

	// =============================================
	// 바코드 스캔 내역 스타일
	//----------------------------------------------
	bottomSheet	: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.43, backgroundColor: colors.WHITE, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 12 },
	header		: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
	title		: { fontSize: 16, fontWeight: 'bold', color: colors.TEXT },
	clearButtonInner: { flexDirection: 'row', alignItems: 'center' },
	clearDeleteImage: { width: 22, height: 22 },
	clearButton: { paddingLeft: 5, paddingRight: 8, paddingVertical: 3, borderRadius: 4, borderColor: colors.RED, borderWidth: 1 },
	clearButtonText: { color: colors.RED, fontSize: 13 },
	list		: { flex:1 },
	listContent: { flexGrow: 1 },
	emptyBox: { flex:1, justifyContent:'center', alignItems:'center' },
	emptyText: { fontSize: 15, color: colors.SECONDARY },
	scanItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.WHITE, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 12, marginBottom: 5,
							shadowColor: colors.LIGHT_GRAY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
							borderWidth: 0.5, borderColor: '#EEEEEE', },
	indexBadge: { width: 25, height: 25, borderRadius: 16, backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center', marginRight: 8, },
	itemContent: { flex:1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: 8, },
	indexText: { fontSize: 12, color: colors.DARK_GRAY },
	barcodeText: { fontSize: 15, color: colors.TEXT, fontWeight: 'bold' },
	timeText: { fontSize: 12, color: '#8C8C8C' },
	divider: { width: 1, height: '100%', backgroundColor: colors.GRAY, marginRight: 8 },
	deleteImage: { width: 24, height: 24 },
	confirmButton: { backgroundColor: colors.DEFAULT, paddingVertical: 12, borderRadius: 15, alignItems: 'center', marginBottom: 8, marginTop: 10 },
	confirmButtonText: { color: colors.WHITE, fontSize: 16, fontWeight: 'bold' },
	// =============================================
});
