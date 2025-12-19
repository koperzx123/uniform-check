// screens/CameraCapture.js
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CameraCapture({ navigation, route }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [taking, setTaking] = useState(false);

  // ============================================================
  // REQUEST PERMISSION
  // ============================================================
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // ============================================================
  // LOADING PERMISSION
  // ============================================================
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.infoText}>กำลังตรวจสอบสิทธิ์กล้อง...</Text>
      </View>
    );
  }

  // ============================================================
  // PERMISSION DENIED
  // ============================================================
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>ต้องการสิทธิ์การใช้กล้อง</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionBtn}
        >
          <Text style={styles.permissionText}>อนุญาต</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // TAKE PHOTO
  // ============================================================
  async function handleTakePhoto() {
    if (!cameraRef.current || taking) return;

    try {
      setTaking(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
        skipProcessing: true,
      });

      // ส่งรูปกลับไปหน้าเดิม
      if (route.params?.onCapture) {
        route.params.onCapture(photo);
      }

      navigation.goBack();
    } catch (err) {
      console.log("Camera error:", err);
      alert("ถ่ายภาพไม่สำเร็จ");
    } finally {
      setTaking(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* OVERLAY เส้นแบ่งครึ่ง */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.topHalf} />
        <View style={styles.line} />
        <View style={styles.bottomHalf} />
      </View>

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleTakePhoto}
          disabled={taking}
        >
          {taking ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.captureText}>ถ่ายภาพ</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },

  camera: {
    flex: 1,
  },

  center: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  infoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  permissionBtn: {
    backgroundColor: "#ffffffdd",
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 999,
  },

  permissionText: {
    fontWeight: "700",
    color: "#000",
  },

  cancelText: {
    color: "#94A3B8",
    marginTop: 12,
  },

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

  topBar: {
    position: "absolute",
    top: 40,
    left: 20,
  },

  bottomBar: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },

  captureBtn: {
    backgroundColor: "#ffffffdd",
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 999,
  },

  captureText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
  },
});
