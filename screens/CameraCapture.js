// screens/CameraCapture.js
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraCapture({ navigation, route }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>กำลังโหลดการอนุญาต...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>ต้องการสิทธิ์การใช้กล้อง</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.captureBtn}>
          <Text>อนุญาต</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleTakePhoto() {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
      base64: true,
    });

    if (route.params?.onCapture) {
      route.params.onCapture(photo);
    }

    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      />

      {/* Overlay เส้นแบ่งครึ่ง */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.topHalf} />
        <View style={styles.line} />
        <View style={styles.bottomHalf} />
      </View>

      {/* ปุ่มถ่าย */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto}>
          <Text style={styles.captureText}>ถ่ายภาพ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
  },

  topHalf: { flex: 1 },
  bottomHalf: { flex: 1 },

  line: {
    width: "100%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  bottomBar: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },

  captureBtn: {
    backgroundColor: "#ffffffdd",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 999,
  },

  captureText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
});
